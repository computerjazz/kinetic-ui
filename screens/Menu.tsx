import React, { Component } from 'react'
import { Text, View, TouchableOpacity, Dimensions, ScrollView, SafeAreaView } from 'react-native'
import StackPreview from '../components/StackPreview'
import CarouselPreview from '../components/CarouselPreview'
import FlipPreview from '../components/FlipPreview'
import DeckPreview from '../components/DeckPreview'
import GridPreview from '../components/GridPreview'
import BookPreview from '../components/BookPreview'
import DotPreview from '../components/DotPreview'

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
    Preview: BookPreview,
  },
  {
    title: "Dots",
    screen: "Dots",
    Preview: DotPreview,
  }

]

class Menu extends Component {
  clock = new Clock()
  focused = new Value(0)

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
    </TouchableOpacity>
  )

  render() {
    return (
      <View style={{
        flex: 1, backgroundColor: '#888' }}
      >
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