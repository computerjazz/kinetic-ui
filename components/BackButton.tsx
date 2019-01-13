import React, { Component } from 'react'
import { TouchableOpacity, Text } from 'react-native'

class BackButton extends Component {
  render() {
    return (
      <TouchableOpacity style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: 50, 
        height: 50, 
        alignItems: 'center',
        justifyContent: 'center',
      }} onPress={this.props.onPress}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: this.props.color || '#ddd' }}>←</Text>
      </TouchableOpacity>
    )
  }
}

export default BackButton