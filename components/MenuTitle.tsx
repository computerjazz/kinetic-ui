import * as React from 'react'
import { Text, View, StyleSheet } from 'react-native'


type Props = {
  color?: string,
  text: string,
}
class MenuTitle extends React.Component<Props> {
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
          color: this.props.color || 'seashell',
        }}>{this.props.text}</Text>
      </View>
    )
  }
}

export default MenuTitle