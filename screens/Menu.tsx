import React, { Component } from 'react'
import { Text, View, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native'
import StackPreview from '../components/StackPreview'
import CarouselPreview from '../components/CarouselPreview'
import FlipPreview from '../components/FlipPreview'
import DeckPreview from '../components/DeckPreview'
import GridPreview from '../components/GridPreview'
import { Transition } from 'react-navigation-fluid-transitions'

const { width, height } = Dimensions.get('window')
import Animated from 'react-native-reanimated'
const { Clock, Value } = Animated

const screens = [
  {
    title: 'Stack',
    screen: 'Stack',
    Preview: StackPreview,
  }, 
  {
    title: 'Carousel',
    screen: 'Carousel',
    Preview: CarouselPreview,
  }, 
  {
    title: 'Flip',
    screen: 'Flip',
    Preview: FlipPreview,
  },
  {
    title: 'Deck',
    screen: 'Deck',
    Preview: DeckPreview,
  },
  {
    title: 'Grid',
    screen: 'Grid',
    Preview: GridPreview,
  },
  {
    title: "Book",
    screen: "Book",
  },

]

class Menu extends Component {
  clock = new Clock()
  focused = new Value(0)

  componentDidMount() {

    this.didFocusSub = this.props.navigation.addListener('didFocus', () => {
      // setTimeout(() => this.focused.setValue(1), 1000)
    })
  }

  renderOption = ({title, screen, Preview }) => (
    <TouchableOpacity 
    key={`menu-option-${title}`} 
    style={{ 
      padding: 12, 
      alignItems: 'center',
      justifyContent: 'center',
      width: width / 2,
      height: width / 2,
    }} onPress={() => {
      this.focused.setValue(0)
      this.props.navigation.navigate(screen)
    }}>
    {!!Preview ? 
      <Preview focused={this.focused} clock={this.clock} width={width / 2} height={width / 2} /> 
      : (
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
          paddingBottom: 20,
        }}
      >
      {screens.map(this.renderOption)}
      </ScrollView>
      </View>
    )
  }
}

export default Menu