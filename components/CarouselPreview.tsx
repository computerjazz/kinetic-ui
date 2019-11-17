import * as React from 'react'
import { View, Platform, Text, StyleSheet } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
import { Transition } from 'react-navigation-fluid-transitions'
import MenuTitle from './MenuTitle';
const {
  Value,
  modulo,
  add,
  sub,
  multiply,
  diff,
  min, 
  abs,
  set,
  sin,
  cond,
  clockRunning,
  startClock,
  stopClock,
  timing,
} = Animated

const isAndroid = Platform.OS === 'android'

class CarouselPreview extends React.Component {

  constructor(props) {
    super(props)
    const { focused, clock, height, width } = props
    this.mainHandler = React.createRef()

    this.translationX = new Value(0)
    this.prevTrans = new Value(0)
    this.cumulativeTrans = new Value(0)
    this.perspective = new Value(850)
    this.activeCardIndex = new Value(0)



    this.animState = {
      finished: new Value(0),
      position: new Value(0),
      frameTime: new Value(0),
      time: new Value(0),
    }

    this.animConfig = {
      toValue: new Value(0),
      duration: new Value(5000),
      easing: Easing.out(Easing.ease),
    }


    this.altState = {
      finished: new Value(0),
      position: new Value(0),
      velocity: new Value(0),
      time: new Value(0),
    }

    this.altConfig = {
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      toValue: new Value(0),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    }

    const numCards = 7
    const tickWidth = width / 2
    const size = width * 0.8
    const maxIndex = numCards - 1

    this._temp = new Value(0)
    const previewState = {
      finished: new Value(0),
      position: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
    }

    const previewConfig = {
      toValue: numCards * tickWidth,
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
    const cumulativeTrans = add(
      this.prevTrans, 
      this.translationX, 
      cond(focused, runClock, 0)

      ) 
      

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / maxIndex
      const index = new Value(i)


      const interpolated = Animated.interpolate(cumulativeTrans, {
        inputRange: [-tickWidth, 0, tickWidth],
        outputRange: [sub(index, 1), index, add(index, 1)],
      })

      const leanAmt = multiply(diff(cumulativeTrans), 0.005)
      const transToIndex = modulo([
        set(this._temp, leanAmt),
        interpolated], arr.length)

      const rotateX = multiply(min(0.2, abs(add(leanAmt, this.altState.position))), -1)
      const rotateY = Animated.interpolate(transToIndex, {
        inputRange: [0, numCards],
        outputRange: [0, Math.PI * 2],
      })

      const translateX = multiply(width / 3, sin(rotateY))
      const translateY = 0

      const scaleXY = add(1,
        multiply(0.2, sin(add(Math.PI / 2, rotateY))),
      )

      const zIndex = Animated.interpolate(transToIndex, {
        inputRange: [0, arr.length / 2, arr.length],
        outputRange: [200, 0, 200],
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
      const colorIndex = maxIndex - (i + maxIndex) % (arr.length)
      const cardTransY = new Value(0)
      const cardGestureState = new Value(0)
      const cardState = {
        finished: new Value(0),
        position: new Value(1),
        velocity: new Value(0),
        time: new Value(0),
      }

      const cardConfig = {
        damping: 15,
        mass: 1,
        stiffness: 150,
        overshootClamping: false,
        toValue: new Value(0),
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
      }

      return {
        color: `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`,
        scale: scaleXY,
        zIndex,
        translateX,
        translateY,
        size,
        rotateY,
        rotateX,
        index: i,
        perspective: this.perspective,
        handlerRef: React.createRef(),
        cardState,
        cardConfig,
        cardTransY,
        cardGestureState,
      }
    })
  }

  renderCard = ({ handlerRef, cardTransY, cardClock, cardState, cardConfig, cardGestureState, index, color, scale, translateX, translateY, zIndex, rotateY, rotateX, size, perspective }, i) => {

    return (

        <Animated.View 
        key={`carousel-preview-card-${i}`}
        style={{
          zIndex,
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: size / 3.5,
          height: size,
          transform: [{
            perspective,
            translateX,
            scaleX: scale,
            scaleY: scale,
          }]
        }}>
          <Animated.View
            style={{
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
              width: size / 3.5,
              height: size,
              backgroundColor: color,
              borderRadius: 10,
              zIndex,
              transform: [{
                perspective,
                translateY: add(translateY, cardTransY),
                rotateY,
                rotateX,
              }]
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{}</Text>
          </Animated.View>
        </Animated.View>
    )
  }

  render() {
    return (

      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        // padding: 30, 
        overflow: 'hidden',
        backgroundColor: 'seashell',
        borderRadius: this.props.width,
      }}>



        {this.cards.map(this.renderCard)}

      <MenuTitle text="CAROUSEL" />
      </View>
          )
        }
      }
      
export default CarouselPreview