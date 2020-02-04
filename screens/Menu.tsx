import React, { Component } from 'react'
import { View, TouchableOpacity, Dimensions, ScrollView, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationScreenProp } from 'react-navigation'

import StackPreview from '../components/StackPreview'
import CarouselPreview from '../components/CarouselPreview'
import FlipPreview from '../components/FlipPreview'
import DeckPreview from '../components/DeckPreview'
import GridPreview from '../components/GridPreview'
import BookPreview from '../components/BookPreview'
import DotPreview from '../components/DotPreview'

const { width } = Dimensions.get('window')
import Animated from 'react-native-reanimated'
import MenuTitle from '../components/MenuTitle';
const { Clock, Value } = Animated

// Original colors
// const colors = ['rgb(42.5, 85.5, 212.5)', 'rgb(127.5, 0.5, 127.5)']
// const [start, end] = colors

// Opacity modified colors
const colors = ['#5f7ddb', '#7f007f']
const [start, end] = colors



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
    title: 'Grid',
    screen: 'Grid',
    Preview: GridPreview,
  },
  {
    title: "Book",
    screen: "Book",
    Preview: BookPreview,
  },
  {
    title: "Dots",
    screen: "Dots",
    titleColor: "#999",
    Preview: DotPreview,
  },
  {
    title: 'Flip',
    screen: 'Flip',
    Preview: FlipPreview,
  },
]

type Props = {
  navigation: NavigationScreenProp<any>
}

class Menu extends Component<Props> {
  clock = new Clock()
  focused = new Value(0)
  focusListener

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener('didFocus', () => {
      // this.focused.setValue(1)
    })
  }

  renderOption = ({ title, screen, Preview, titleColor }) => (
    <View
      key={`menu-option-${title}`}
      style={{
        margin: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: width / 2,
        height: width / 2,
        overflow: 'hidden',
        borderRadius: width / 2,
        borderColor: '#ddd',
        borderWidth: 4,
      }}
    >
      <Preview title={""} focused={this.focused} clock={this.clock} width={width / 2} height={width / 2} />
      <View style={{
        ...StyleSheet.absoluteFillObject,
      }}>
        <LinearGradient
          style={{ flex: .5, opacity: 0.15 }}
          colors={['black', 'transparent']}
        />
        <View style={{ flex: .25 }} />
        <LinearGradient
          style={{ flex: .25, opacity: 0.1 }}
          colors={['transparent', 'black']}
        />
      </View>
      <TouchableOpacity
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0, .1)'
        }}
        onPress={() => {
          this.focused.setValue(0)
          this.props.navigation.navigate(screen)
        }}
      >
        <MenuTitle text={title.toUpperCase()} color={titleColor || 'seashell'} />
      </TouchableOpacity>
    </View>
  )

  renderBackground = () => (
    <View style={{
      ...StyleSheet.absoluteFillObject,
    }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: start
        }}
      />
      <View style={{
        flex: 1,
        backgroundColor: end
      }} />
    </View>
  )


  render() {

    return (
      <View style={{
        flex: 1, backgroundColor: 'seashell'
      }}
      >
        {Platform.OS === "ios" && this.renderBackground()}


        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient style={{
            flex: 1,
            paddingTop: 40,
            paddingBottom: 50,
            width: '100%',
            alignItems: 'center',
          }}
            colors={[start, end]}
          >
            {screens.map(this.renderOption)}
          </LinearGradient>
        </ScrollView>
      </View>
    )
  }
}

export default Menu