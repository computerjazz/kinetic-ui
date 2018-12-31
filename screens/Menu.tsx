import React, { Component } from 'react'
import { Text, View, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native'
import StackPreview from '../components/StackPreview'
import CarouselPreview from '../components/CarouselPreview'
import FlipPreview from '../components/FlipPreview'

const { width, height } = Dimensions.get('window')

const screens = [
  {
    title: 'Stack',
    Preview: StackPreview,
  }, 
  {
    title: 'Carousel',
    Preview: CarouselPreview,
  }, 
  {
    title: 'Flip',
    Preview: FlipPreview
  }]

class Menu extends Component {

  renderOption = ({title, Preview }) => (
    <TouchableOpacity 
    key={`menu-option-${title}`} 
    style={{ 
      padding: 12, 
      alignItems: 'center',
      justifyContent: 'center',
      width: width / 2,
      height: width / 2,
    }} onPress={() => this.props.navigation.navigate(title)}>
    {!!Preview ? <Preview width={width / 2} height={width / 2} /> : (
      <View
        style={{
            flex: 1,
            width: '100%',
            backgroundColor: 'seashell',
            borderRadius: width / 2,
            alignItems: 'center',
            justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#555', fontSize: 24, fontWeight: 'bold' }}>{title}</Text>
        </View>
    )}
    </TouchableOpacity>
  )

  render() {
    return (
      <View style={{
        flex: 1, backgroundColor: '#555' }}>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          marginTop: 20,
        }}
      >
      {screens.map(this.renderOption)}
      </ScrollView>
      </View>
    )
  }
}

export default Menu