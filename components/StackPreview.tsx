import * as React from 'react'
import { View, Platform, Text, StyleSheet } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
import MenuTitle from './MenuTitle';

const {
  Value,
  modulo,
  add,
  sub,
  multiply,
  divide,
  startClock,
  stopClock,
  clockRunning,
  cond,
  set,
  Clock,
  debug,
  timing,
  block,
} = Animated

const isAndroid = Platform.OS === 'android'

class StackPreview extends React.Component {

  constructor({ focused, clock, width, height }) {
    super()
    const tickHeight = height * .85
    const numCards = 7

    this.mainHandler = React.createRef()
    this.translationY = new Value(0)
    this.prevTrans = new Value(0)
    this.cumulativeTrans = new Value(0)
    this.perspective = new Value(850)
    this.auto = new Value(0)

    const previewState = {
      finished: new Value(0),
      position: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
    }

    const previewConfig = {
      toValue: numCards * tickHeight,
      duration: 20000,
      easing: Easing.linear,
    }

    const runClock = [
      cond(clockRunning(clock), [
        timing(clock, previewState, previewConfig),
        cond(previewState.finished, [
          stopClock(clock),
          set(previewState.finished, 0),
          set(previewState.time, 0),
          set(previewState.frameTime, 0),
          set(previewState.position, 0),
          startClock(clock),
        ])
      ], [
        startClock(clock),
      ]),
      previewState.position
    ]

    this._tempOffset = new Value(0)
    this.cumulativeTrans = add(
      this.prevTrans,
      this.translationY,
      cond(focused, runClock, 0) // NOTE: was causing janky transitions
    )



    this.activeIndex = Animated.interpolateNode(modulo(this.cumulativeTrans, tickHeight * numCards), {
      inputRange: [0, tickHeight],
      outputRange: [0, 1],
    })

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)
      const index = new Value(i)
      const size = width * 0.75
      const gestureState = new Value(0)


      const scale = new Value(1)
      const interpolatedY = Animated.interpolateNode(this.cumulativeTrans, {
        inputRange: [-tickHeight, 0, tickHeight],
        outputRange: [sub(index, 1), index, add(index, 1)],
      })

      const transToIndex = modulo(interpolatedY, arr.length)

      const indexToTrans = sub(Animated.interpolateNode([
        transToIndex,
      ], {
        inputRange: [0, 0.5, 0.75, 1, arr.length],
        outputRange: [0, size, size * 1.9, size * 1.25, 0],
      }), 60)

      const translateY = indexToTrans

      const iosConfig = {
        inputRange: [0, 0.5, 1, 2, arr.length],
        outputRange: [60, 0, 80, 70, 60],
      }

      const androidConfig = {
        inputRange: [0, 0.5, 1, 2, arr.length],
        outputRange: [70, 0, 35, 50, 70],
      }

      const rotateX = Animated.concat(
        Animated.interpolateNode(transToIndex, isAndroid ? androidConfig : iosConfig), 'deg')

      const scaleXY = Animated.interpolateNode(transToIndex, {
        inputRange: [0, 0.25, 0.5, 1, arr.length],
        outputRange: [scale, multiply(scale, 1.2), multiply(scale, 1.24), divide(scale, 2), scale],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const zIndex = Animated.interpolateNode(transToIndex, {
        inputRange: [0, 0.7, 0.75, 1, arr.length],
        outputRange: [999, 999, 0, 0, 200],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      // Somehow the top of the stack ended up as index 0
      // but the next item down is arr.length - 1
      // for example, indices would go
      // 0
      // 4
      // 3
      // 2
      // 1
      // `colorIndex` compensates for this
      const maxIndex = arr.length - 1
      const colorIndex = maxIndex - (i + maxIndex) % (arr.length)
      return {
        color: `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`,
        scale: scaleXY,
        zIndex,
        translateY,
        size,
        rotateX,
        index: colorIndex,
        gestureState,
        perspective: this.perspective,
      }
    })
  }

  renderCard = ({ perspective, color, scale, translateY, zIndex, rotateX, size, gestureState, index }, i) => {
    return (
      <Animated.View
        key={`card-${i}`}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 10,
          zIndex,
          transform: [
            {perspective},
            {translateY},
            {scaleX: scale},
            {scaleY: scale},
            {rotateX},
          ]
        }}
      >
        <Animated.View style={{ flex: 1, width: size }}>
          <Text style={{
            color: 'white',
            fontSize: 70,
            fontWeight: 'bold',
          }}>
            {}
          </Text>
        </Animated.View>
      </Animated.View>
    )
  }
  render() {
    return (

      <View style={{
        flex: 1,
        alignItems: 'center',
        width: '100%',
        padding: 30,
        overflow: 'hidden',
        backgroundColor: 'seashell',
        borderRadius: this.props.width,
      }}>

        {this.cards.map(this.renderCard)}
      </View>
    )
  }
}

export default StackPreview