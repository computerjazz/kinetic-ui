import React, { Component } from 'react'
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native'


const screens = ['Stack', 'Carousel', 'Flip']

class Menu extends Component {

  renderOption = (routeName) => (
    <TouchableOpacity key={`menu-option-${routeName}`} style={{ 
      backgroundColor: '#666',
      borderRadius: 3,
      padding: 5, 
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,
    }} onPress={() => this.props.navigation.navigate(routeName)}>
      <Text style={{ color: 'white' }}>{routeName}</Text>
    </TouchableOpacity>
  )

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#efefef', padding: 30, }}>
      <Text style={{
        color: '#333',
        fontWeight: 'bold',
        fontSize: 18,
        padding: 10,
      }}>Demos</Text>
      {screens.map(this.renderOption)}
      </View>
    )
  }
}

export default Menu