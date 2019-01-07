import * as React from 'react'
import { Text, View, StyleSheet } from 'react-native'

class MenuTitle extends React.Component {
  render() {
    return (
      <View style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',

      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'seashell',
        }}>{this.props.text}</Text>
      </View>
    )
  }
}

export default MenuTitle