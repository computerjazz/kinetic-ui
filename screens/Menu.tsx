import React, { Component } from 'react'
import { Text, View, TouchableOpacity, Dimensions, ScrollView, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';

import StackPreview from '../components/StackPreview'
import CarouselPreview from '../components/CarouselPreview'
import FlipPreview from '../components/FlipPreview'
import DeckPreview from '../components/DeckPreview'
import GridPreview from '../components/GridPreview'
import BookPreview from '../components/BookPreview'
import DotPreview from '../components/DotPreview'

const { width } = Dimensions.get('window')
import Animated from 'react-native-reanimated'
const { Clock, Value } = Animated

const screens = [
  {
    title: 'Deck',
    screen: 'Deck',
    Preview: DeckPreview,
  },
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
    title: "Book",
    screen: "Book",
    Preview: BookPreview,
  },
  {
    title: "Dots",
    screen: "Dots",
    Preview: DotPreview,
  },
  {
    title: 'Flip',
    screen: 'Flip',
    Preview: FlipPreview,
  },
  {
    title: 'Grid',
    screen: 'Grid',
    Preview: GridPreview,
  },

]

class Menu extends Component {
  clock = new Clock()
  focused = new Value(0)

  renderOption = ({ title, screen, Preview }) => (
    <TouchableOpacity
      key={`menu-option-${title}`}
      style={{
        margin: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: width / 2,
        height: width / 2,
        overflow: 'hidden',
        borderRadius: width / 2,
      }} onPress={() => {
        this.focused.setValue(0)
        this.props.navigation.navigate(screen)
      }}>
      {!!Preview ?
        <Preview title={title} focused={this.focused} clock={this.clock} width={width / 2} height={width / 2} />
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
      <View style={{
        ...StyleSheet.absoluteFillObject,
      }}>
        <LinearGradient
          style={{ flex: .5, opacity: 0.2 }}
          colors={['black', 'transparent']}
        />
        <View style={{ flex: .25 }} />
        <LinearGradient
          style={{ flex: .25, opacity: 0.15 }}
          colors={['transparent', 'black']}
        />
      </View>
    </TouchableOpacity>
  )

  render() {
    return (
      <View style={{
        flex: 1, backgroundColor: 'seashell'
      }}
      >
        <LinearGradient style={{
          ...StyleSheet.absoluteFillObject,
          opacity: 0.75,
        }}
          colors={['rgb(42.5, 85.5, 212.5)', 'rgb(127.5, 0.5, 127.5)']}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'center',
            marginTop: 40,
            paddingBottom: 50,
          }}
        >
          {screens.map(this.renderOption)}
        </ScrollView>
      </View>
    )
  }
}

export default Menu