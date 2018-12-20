import React, { Component } from 'react'
import { TouchableOpacity, Text } from 'react-native'

class BackButton extends Component {
  render() {
    return (
      <TouchableOpacity style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30 }} onPress={this.props.onPress}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: this.props.color || 'white' }}>←</Text>
      </TouchableOpacity>
    )
  }
}

export default BackButton