import React from 'react';
import PropTypes from 'prop-types'

import { AsyncStorage, Button, Dimensions, Keyboard, Platform, Share, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { ConfirmDialog } from 'react-native-simple-dialogs';

import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/Ionicons';

const placeholderText = 'Tap to edit...';
const bullet = '•';

class Tab extends React.Component {
  state = {
    placeholderText: placeholderText
  }
  static propTypes = {
    routeKey: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    bottomOffset: PropTypes.number.isRequired,
    onChangeText: PropTypes.func.isRequired,
    onSelectionChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);

    this.onChangeText = this.onChangeText.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
  }

  onChangeText(text) {
    this.props.onChangeText(this.props.routeKey, text);
  }

  onSelectionChange(event) {
    let selection = event.nativeEvent.selection;
    this.props.onSelectionChange(selection);
  }

  render() {
    let backgroundColor = ((this.props.routeKey % 2) == 0) ? '#555' : '#444';
    return (
      <View style={[styles.scene, {backgroundColor: backgroundColor}]}>
        <TextInput 
          style={{color: '#FAFAFA', fontSize: 18, textAlignVertical: 'top', padding: 10,
            height: (Dimensions.get('window').height - 150 - this.props.bottomOffset)}}
          multiline={true}
          autoCorrect={true}
          ref={(input) => this.input = input}
          placeholder={this.state.placeholderText}
          onFocus={() => this.setState({placeholderText: ''})}
          onBlur={() => this.setState({placeholderText: placeholderText})}
          autoFocus={true}
          value={this.props.text}
          onChangeText={this.onChangeText}
          onSelectionChange={this.onSelectionChange}
          autoCapitalize={this.props.capitalize ? 'words' : 'sentences'}
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
      bottomOffset={this.state.bottomOffset}
      onSelectionChange={(selection) => {
        if (this.state.capitalize && (selection.start < this.selection.start)) {
          this.setState({capitalize: false});
        }
        this.selection = selection;
      }}
      onChangeText={this.handleChangeText}
      capitalize={this.state.capitalize}
      />;
  }

  constructor(props) {
    super(props);
    //Bind handlers
    this.renderScene = this.renderScene.bind(this);
    this.newNote = this.newNote.bind(this);
    this.deleteCurrentNote = this.deleteCurrentNote.bind(this);
    this.handleChangeText = this.handleChangeText.bind(this);

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

  handleChangeText(key, content) {

    let wasCharAdded = content.length >= (this.state.notes[key].length + 1);
    let lastChar = content[content.length - 1];

    if (wasCharAdded) {
      // If last char was newline and previous line starts with bullet, continue the list
      if (lastChar === '\n'
          && this.selection && (this.selection.start === this.selection.end)
          && this.selection.end === (content.length - 1)) {
        let lines = content.split('\n');
        if (lines.length > 1 && (lines[lines.length - 2][0] === bullet)) {
          if (lines[lines.length - 2].length > 2) this.setState(this.addBulletToCurrentNote);
          else if (lines[lines.length - 2].length === 2) this.setState(this.clearLastLine);
          return;
        }
      }
      // If last char was - and is first char on newline, replace with bullet
      if (lastChar === '-') {
        let lines = content.split('\n');
        if (lines.length > 1 && lines[lines.length - 1][0] === lastChar) {
          this.setState(this.clearLastLine, () =>
            this.setState(this.addBulletToCurrentNote));
          return;
        }
      }

      if (this.state.capitalize && lastChar === ' ' && content[content.length - 2] !== bullet) {
        this.setState({capitalize: false});
      }

    }
    // Save state
    let notes = this.state.notes;
    let routes = [...this.state.routes];
    var index;
    for (index = 0; index < routes.length; index++) {
      if (routes[index].key == key) break;
    }
    routes[index].title = displayTitle(content);
    this.setState({
      notes: {...notes, [key]: content},
      routes: routes
    });

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

  async share() {
    let key = this.state.routes[this.state.index].key;
    try {
      const result = await Share.share({
        message: this.state.notes[key],
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      alert(error.message);
    }
  };

  clearLastLine(prevState) {
    let key = this.state.routes[this.state.index].key;
    let lines = prevState.notes[key].split('\n');
    if (lines.length > 1) lines[lines.length - 1] = '';
    return ({
      notes: {...prevState.notes, [key]: lines.join('\n')}
    });
  }

  addBulletToCurrentNote(prevState) {
    //Add bullet to text up until selection, then append text post selection

    let key = this.state.routes[this.state.index].key;
    let prevNote = prevState.notes[key];
    let beforeText = prevNote.substr(0, this.selection.start)
    let afterText =  prevNote.substr(this.selection.end, prevNote.length);

    let lines = beforeText.split('\n');
    let needsNewline = lines[lines.length - 1].trim() !== '';
    if (afterText) setTimeout(() => this.tabs[key].input.setNativeProps({selection: {start: beforeText.length + 2, end: beforeText.length + 2}}), 50);
    return ({
      capitalize: true,
      notes: {...prevState.notes, [key]: (beforeText
        + (needsNewline ? '\n' : '')
        + '• '
        + afterText)}
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

        <View style={{position: 'absolute', bottom: this.state.bottomOffset, width: '100%', margin: 5}}>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', position: 'relative'}}>
            <Icon.Button name="md-trash" onPress={() => this.setState({deleteDialog: true})}
              style={[styles.actionButtonIcon, styles.large, {backgroundColor: '#AA3333'}]} />
            <Icon.Button name="md-more" onPress={() => this.setState(this.addBulletToCurrentNote)}
              style={[styles.actionButtonIcon, styles.large, {backgroundColor: '#333', fontSize: 12}]} />
            <Icon.Button name="md-mic" onPress={() => alert('Voice memo not implemented')}
              style={styles.actionButtonIcon, styles.large} />
            <Icon.Button name="md-camera" onPress={() => alert('Camera input not implemented')}
              style={styles.actionButtonIcon, styles.large} />
            <Icon.Button name="md-brush" onPress={() => alert('Drawing not implemented')}
              style={styles.actionButtonIcon, styles.large} />
            <Icon.Button name="ios-share" onPress={() => this.share()}
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
    fontSize: 36, height: 50, padding: 10, color: 'white', paddingLeft: 20
  }
});

function displayTitle(text) {
  //TODO: Make this smarter
  if (text.length == 0) return "New note"
  else return text.split('\n')[0].substr(0, 15);
}