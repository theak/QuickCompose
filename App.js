import React from 'react';
import PropTypes from 'prop-types'

import { Dimensions, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import AsyncStorage from '@react-native-community/async-storage';
import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/Ionicons';



const placeholderText = "Tap to edit...";

class Tab extends React.Component {
  state = {
    placeholderText: placeholderText
  }
  static propTypes = {
    index: PropTypes.number.isRequired,
    onChangeText: PropTypes.func
  }

  render() {
    backgroundColor = ((this.props.index % 2) == 0) ? '#555' : '#444';
    return (
      <View style={[styles.scene, {backgroundColor: backgroundColor}]} key={this.props.index}>
        <TextInput 
          style={{color: '#FFF', height: '100%', fontSize: 32, textAlignVertical: 'top', padding: 10}}
          multiline={true}
          ref={(input) => this.input = input}
          placeholder={this.state.placeholderText}
          onFocus={() => this.setState({placeholderText: ''})}
          onBlur={() => this.setState({placeholderText: placeholderText})}
          autoFocus={true}
          onChangeText={(text) => this.props.onChangeText(this.props.index, text)}
          />
          <View style={{position: 'absolute', bottom: 0, width: '100%'}}>
          <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', position: 'relative'}}>
            <View style={{width: 60, height: 70, backgroundColor: '#AA3333'}}>
                <Icon name="md-trash" style={[styles.actionButtonIcon, styles.large]} />
            </View>
            <View style={{width: 60, height: 70, backgroundColor: '#666'}}>
                {/*<Icon name="md-list-box" style={[styles.actionButtonIcon, styles.large]} />*/} 
                <Text style={[styles.actionButtonIcon, styles.large]}>•</Text>
            </View>
            <View style={{width: 100, height: 70, backgroundColor: '#33AA33'}}>
                <Icon name="ios-share" style={[styles.actionButtonIcon, styles.large]} />
            </View>
          </View>
          </View>

          <ActionButton buttonColor="rgba(231,76,60,1)" style={{marginBottom: 60}} >
            <ActionButton.Item buttonColor='#9b59b6' title="Text" onPress={() => console.log("new note!")}>
              <Icon name="md-create" style={styles.actionButtonIcon} />
            </ActionButton.Item>
            <ActionButton.Item buttonColor='#3498db' title="Voice" onPress={() => {}}>
              <Icon name="md-mic" style={styles.actionButtonIcon} />
            </ActionButton.Item>
            <ActionButton.Item buttonColor='#1abc9c' title="Photos" onPress={() => {}}>
              <Icon name="md-camera" style={styles.actionButtonIcon} />
            </ActionButton.Item>
          </ActionButton>
      </View>
    )
  }
}


export default class App extends React.Component {
  state = {
    index: 0,
    notes: {0: []},
    routes: [
      { key: 0, title: 'New note' },
      { key: 1, title: 'Second' },
    ],
  };

  renderScene(scene) {
    return <Tab 
      index={scene.route.key}
      onChangeText={ (index, content) => {
        this.state.notes[index] = content;
      }}
      />;
  }

  constructor(props) {
    super(props);
    //Bind handlers
    this.renderScene = this.renderScene.bind(this);

    //Dynamically initialize routes
  }

  render() {
    return (
          <TabView
            navigationState={this.state}
            renderScene={this.renderScene}
            onIndexChange={index => this.setState({ index })}
            initialLayout={{ width: Dimensions.get('window').width }}
            style={styles.container}
          />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: StatusBar.currentHeight
  },
  scene: {
    flex: 1,
  },
  actionButtonIcon: {
    fontSize: 20, height: 22, textAlign: 'center'
  },
  large: {
    fontSize: 36, height: 50, padding: 10, color: 'white', paddingTop: 16
  }
});

function displayTitle(text) {
  //TODO: Make this smarter
  if (text.length == 0) return "New note"
  else return text.split('\n')[0].substr(0, 18);
}