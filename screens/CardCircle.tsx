import React, { Component } from 'react'
import { View, Dimensions, Text } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

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
  diff,
  min,
} = Animated;

import BackButton from '../components/BackButton'
class CardStack extends Component {
  state = {}

  constructor() {
    super()
    this.translationX = new Value(0)
    this.prevTrans = new Value(0)
    this.cumulativeTrans = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this.activeCardIndex = new Value(0)
    this.perspective = new Value(850)
    this.clock = new Clock()
    this.altClock = new Clock()


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

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / maxIndex
      const index = new Value(i)

      const runClock = [
        cond(clockRunning(this.clock), [
          timing(this.clock, this.animState, this.animConfig),
          cond(and(eq(this.animState.finished, 1), clockRunning(this.clock)), [
            stopClock(this.clock),
            set(this.animState.time, 0),
            set(this.animState.frameTime, 0),
            set(this.animState.finished, 0),
          ]),
        ]),
        cond(clockRunning(this.altClock), [
          spring(this.altClock, this.altState, this.altConfig),
          cond(and(eq(this.altState.finished, 1), clockRunning(this.altClock)), [
            stopClock(this.altClock),
            set(this.altState.time, 0),
            set(this.altState.velocity, 0),
            set(this.altState.finished, 0),
            set(this.altState.position, 0),
          ]),
        ])
        
      ]

      const cumulativeTrans = multiply(add(this.prevTrans, this.translationX, this.animState.position), -1)

      const interpolated = Animated.interpolate(cumulativeTrans, {
        inputRange: [-tickWidth, 0, tickWidth],
        outputRange: [sub(index, 1), index, add(index, 1)],
      })

      const rotAmt =  multiply(diff(cumulativeTrans), 0.005)
      const transToIndex = modulo([
        runClock, 
        set(this._temp, rotAmt),
        interpolated], arr.length)

      const rotateX = multiply(min(0.2, abs(add(rotAmt, this.altState.position))), -1)
      const rotateY = Animated.interpolate( transToIndex, {
        inputRange: [0, numCards],
        outputRange: [0, -Math.PI * 2],
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
      }
    })
  }

  renderCard = ({ index, color, scale, translateX, translateY, zIndex, rotateY, rotateX, size, perspective }, i) => {
    return (
      <Animated.View
        key={`card-${i}`}
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: size / 4,
          height: size,
          backgroundColor: color,
          borderRadius: 10,
          zIndex,
          transform: [{
            perspective,
            translateX,
            translateY,
            scaleX: scale,
            scaleY: scale,
            rotateY,
            rotateX,
          }]
        }}
      />
    )
  }

  velocity = new Value(0)

  render() {
    // console.log('cards', this.cards) // NOTE: logging out animated data causes Expo to freeze
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <TapGestureHandler
          onHandlerStateChange={event([
            {nativeEvent: ({ state }) => block([
              cond(eq(state, State.BEGAN), [ 
                cond(clockRunning(this.clock), [
                  set(this.altState.position, this._temp),
                  startClock(this.altClock),
                  stopClock(this.clock),
                  set(this.animState.time, 0),
                  set(this.animState.frameTime, 0),
                  set(this.animState.finished, 0)
                ])
              
              ])
            ])}
          ])}
        >
        <Animated.View>
        <PanGestureHandler
          onGestureEvent={event([{
            nativeEvent: ({ translationX: x, velocityX, state }) => block([
              set(this.translationX, x),
              set(this.velocity, velocityX),
            ])
          }])}
          onHandlerStateChange={event([{
            nativeEvent: ({ state }) => block([
              set(this.gestureState, state),
              onChange(this.gestureState, [
                cond(eq(this.gestureState, State.ACTIVE), [
                  cond(clockRunning(this.clock), [
                    stopClock(this.clock),
                    set(this.animState.time, 0),
                    set(this.animState.frameTime, 0),
                    set(this.animState.finished, 0)
                  ]),
                ]),

                cond(eq(this.gestureState, State.END),
                  [
                    set(this.prevTrans, add(this.translationX, this.prevTrans)),
                    set(this.translationX, 0),
                    cond(clockRunning(this.clock), stopClock(this.clock)),
                    cond(greaterThan(abs(this.velocity), 0), [
                      set(this.animConfig.toValue, this.velocity),
                      set(this.animConfig.duration, 5000),
                      startClock(this.clock),
                    ]),
                  ]),
              ]),
            ])
          }]
          )}
        >
          <Animated.View style={{ 
            flex: 1, 
            marginTop: 50, 
            alignItems: 'center', 
            justifyContent: 'center' ,
          }}>
            {this.cards.map(this.renderCard)}
          </Animated.View>
        </PanGestureHandler>
        </Animated.View>
          </TapGestureHandler>
        <BackButton color="#ddd" onPress={() => {
          this.props.navigation.goBack(null)
        }} />
      </View>
    )
  }
}

export default CardStack