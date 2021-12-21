import * as React from 'react'
import { Dimensions, View, StyleSheet, Text } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
import BackButton from '../components/BackButton'
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import MenuTitle from './MenuTitle'
const {
  onChange,
  debug,
  and,
  not,
  set,
  neq,
  cond,
  eq,
  or,
  add,
  multiply,
  greaterThan,
  lessThan,
  floor,
  spring,
  timing,
  divide,
  block,
  round,
  startClock,
  stopClock,
  clockRunning,
  sub,
  defined,
  Value,
  Clock,
  event,
  sin,
  modulo,
  abs,
  cos,
  max,
  min,
} = Animated;



class GridPreview extends React.Component {

  constructor({ height, width, clock }) {

    super()

    const cardsPerRow = 8
    const engageDist = width / 8

    const numCards = Math.pow(cardsPerRow, 2)
    const cardSize = width / Math.sqrt(numCards)
    const influenceDist = width / 2
    const padding = cardSize / 30
    const gravity = Math.PI / 2

    this.pan = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED),
      this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.screenX = new Value(0)
    this.screenY = new Value(0)
    this.clock = new Clock()

    this.panRatio = Animated.interpolateNode(this.pan, {
      inputRange: [0, engageDist],
      outputRange: [0, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })


    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {

      // console.log(`[${row}, ${col}]`)
      const colorMultiplier = 255 / (arr.length - 1)
      const color = `rgba(${i * colorMultiplier}, ${Math.abs(128 - i * colorMultiplier)}, ${255 - (i * colorMultiplier)}, 0.9)`

      return {
        size: cardSize,
        padding,
        color,
        rotateX: 0,
        rotateY: 0,
        scale: 1
      }
    })
  }

  renderCard = ({ color, rotateX, rotateY, scale, size, padding }, index) => {
    return (
      <Animated.View
        key={`grid-card-${index}`}

        style={{
          width: size,
          height: size,
          padding,
        }}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: color,
            borderRadius: size / 10,
            transform: [{
              rotateX,
              rotateY,
              scaleX: scale,
              scaleY: scale,
            }]
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{}</Text>
        </Animated.View>

      </Animated.View>
    )
  }

  render() {
    const { width } = this.props
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderRadius: width,
        overflow: 'hidden',

      }}>
        <Animated.View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: width,
        }}>
          {this.cards.map(this.renderCard)}
        </Animated.View>
      </View>
    )
  }
}

export default GridPreview