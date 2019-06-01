import React from 'react';
import PropTypes from 'prop-types'

import { AsyncStorage, Button, Dimensions, Keyboard, Platform, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { ConfirmDialog } from 'react-native-simple-dialogs';

import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/Ionicons';



const placeholderText = "Tap to edit...";

class Tab extends React.Component {
  state = {
    placeholderText: placeholderText
  }
  static propTypes = {
    routeKey: PropTypes.number.isRequired,
    onChangeText: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired
  }

  render() {
    backgroundColor = ((this.props.routeKey % 2) == 0) ? '#555' : '#444';
    return (
      <View style={[styles.scene, {backgroundColor: backgroundColor}]}>
        <TextInput 
          style={{color: '#FFF', height: '100%', fontSize: 32, textAlignVertical: 'top', padding: 10}}
          multiline={true}
          ref={(input) => this.input = input}
          placeholder={this.state.placeholderText}
          onFocus={() => this.setState({placeholderText: ''})}
          onBlur={() => this.setState({placeholderText: placeholderText})}
          autoFocus={true}
          value={this.props.text}
          onChangeText={(text) => this.props.onChangeText(this.props.routeKey, text)}
          />

      </View>
    )
  }
}

getDefaultState = () => {
  const defaultState = {
    index: 0,
    notes: {0: ""},
    maxKey: 0,
    deleteDialog: false,
    bottomOffset: 0,
    routes: [
      { key: 0, title: 'New note' }
    ],
  }
  return defaultState;
}

export default class App extends React.Component {
  tabs = {}

  renderScene(scene) {
    let key = scene.route.key;
    return <Tab 
      routeKey={key}
      text={this.state.notes[key]}
      ref={(tab) => this.tabs[key] = tab}
      onChangeText={ (key, content) => {
        //TODO: Don't edit this directly- make a copy
        let notes = this.state.notes;
        let routes = this.state.routes;
        var index;
        for (index = 0; index < routes.length; index++) {
          if (routes[index].key == key) break;
        }
        routes[index].title = displayTitle(content);
        this.setState({
          notes: {...notes, [key]: content},
          routes: routes
        });
      }}
      />;
  }

  constructor(props) {
    super(props);
    //Bind handlers
    this.renderScene = this.renderScene.bind(this);
    this.newNote = this.newNote.bind(this);
    this.deleteCurrentNote = this.deleteCurrentNote.bind(this);

    //Get notes from localstorage if it exists, else set to default
    this.state = getDefaultState();

    //Dynamically generate titles and initialize routes
    var routes = [];
    for (var k in this.state.notes) {
      let key = parseInt(k);
      var title = displayTitle(this.state.notes[key]);
      routes.push({key: parseInt(key), title: title});
      if (key > this.state.maxKey) this.state.maxKey = key;
    }
    this.state.routes = routes;
  }

  componentWillMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      this.setState({bottomOffset: e.endCoordinates.height});
    });
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', (e) => {
      this.setState({bottomOffset: 0});
    });
  }

  componentDidMount() {
    AsyncStorage.getItem('appState', (errs,result) => {
      if (!errs) {
        if (result !== null) {
          this.setState({...JSON.parse(result), deleteDialog: false});
        }
      }
    })
  }

  componentDidUpdate() {
    //Write current state to asyncstorage
    try {
      AsyncStorage.setItem('appState', JSON.stringify(this.state));
    } catch (error) {
      alert("error");
    }
  }

  newNote(prevState) {
    let newKey = prevState.maxKey + 1;
    let blankNotes = Object.values(prevState.notes).filter((note) => note === '').length;
    let title = 'New note' + (blankNotes ? (' (' + (blankNotes + 1) + ')') : '');
    return ({
      maxKey: newKey,
      notes: {...prevState.notes, [newKey]: ''},
      routes: [{key: newKey, title: title}, ...prevState.routes],
      index: 0
    });
  }

  deleteCurrentNote(prevState) {
    if (this.state.routes.length <= 1) {
      return getDefaultState();
    }
    let key = this.state.routes[this.state.index].key;
    return ({
      deleteDialog: false,
      notes: {...this.state.notes, [key]: null},
      routes: this.state.routes.filter((_, i) => i !== this.state.index),
      index: 0
    })
  }

  addBulletToCurrentNote(prevState) {
    let key = this.state.routes[this.state.index].key;
    let lines = prevState.notes[key].split('\n');
    let needsNewline = lines[lines.length - 1].trim() !== '';
    return ({
      notes: {...prevState.notes, [key]: (prevState.notes[key] + '• ')}
    });
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <TabView
          navigationState={this.state}
          renderScene={this.renderScene}
          onIndexChange={index => this.setState({ index })}
          initialLayout={{ width: Dimensions.get('window').width }}
          style={styles.container}
        />

        <ConfirmDialog
          title={'Delete "' + this.state.routes[this.state.index].title + '"?'}
          visible={this.state.deleteDialog}
          onTouchOutside={() => this.setState({deleteDialog: false})}
          positiveButton={{title: "Delete", onPress: () => this.setState(this.deleteCurrentNote)}}
          negativeButton={{title: "Cancel", onPress: () => this.setState({deleteDialog: false}) }}
      />

        <View style={{position: 'absolute', bottom: 5 + this.state.bottomOffset, width: '100%'}}>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', position: 'relative'}}>
            <Icon.Button name="md-trash" onPress={() => this.setState({deleteDialog: true})}
              style={[styles.actionButtonIcon, styles.large, {backgroundColor: '#AA3333'}]} />
            <Icon.Button name="md-more" onPress={() => this.setState(this.addBulletToCurrentNote)}
              style={[styles.actionButtonIcon, styles.large, {backgroundColor: '#333', fontSize: 12}]} />
            <Icon.Button name="md-mic" onPress={() => alert('Voice memo not implemented')}
              style={styles.actionButtonIcon, styles.large} />
            <Icon.Button name="md-camera" onPress={() => alert('Camera input not implemented')}
              style={styles.actionButtonIcon, styles.large} />

            <Icon.Button name="ios-share" onPress={() => alert('Share not implemented')}
              style={[styles.actionButtonIcon, styles.large, {backgroundColor: '#33AA33'}]} />
          </View>
        </View>

        <ActionButton buttonColor="rgba(231,76,60,1)" style={{marginBottom: 50 + this.state.bottomOffset, marginRight: -15}} onPress={() => this.setState(this.newNote)}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: ((Platform.OS === 'ios') ? 40 : StatusBar.currentHeight)
  },
  scene: {
    flex: 1,
  },
  actionButtonIcon: {
    fontSize: 20, height: 22, textAlign: 'center'
  },
  large: {
    fontSize: 36, height: 50, padding: 15, color: 'white', paddingLeft: 25
  }
});

function displayTitle(text) {
  //TODO: Make this smarter
  if (text.length == 0) return "New note"
  else return text.split('\n')[0].substr(0, 15);
}