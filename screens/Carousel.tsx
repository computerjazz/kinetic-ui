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
  max,
} = Animated;

import BackButton from '../components/BackButton'
class CardStack extends Component {
  state = {}

  constructor() {
    super()
    this.mainHandler = React.createRef()

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
          // debug('pos', this.animState.position),
          // debug('fin?', this.animState.finished),
          timing(this.clock, this.animState, this.animConfig),
          cond(and(this.animState.finished, clockRunning(this.clock)), [
            // debug('stopping clock', this.animState.position),
            stopClock(this.clock),
            set(this.prevTrans, add(this.prevTrans, this.animState.position)),
            set(this.animState.position, 0),
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

      const cumulativeTrans = add(this.prevTrans, this.translationX, this.animState.position) // TODO: figure out how to do this without inverting

      const interpolated = Animated.interpolate(cumulativeTrans, {
        inputRange: [-tickWidth, 0, tickWidth],
        outputRange: [sub(index, 1), index, add(index, 1)],
      })

      const leanAmt =  multiply(diff(cumulativeTrans), 0.005)
      const transToIndex = modulo([
        runClock, 
        set(this._temp, leanAmt),
        interpolated], arr.length)

      const rotateX = multiply(min(0.2, abs(add(leanAmt, this.altState.position))), -1)
      const rotateY = Animated.interpolate( transToIndex, {
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
      const cardClock = new Clock()
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
        cardClock,
        cardGestureState,
      }
    })
  }


  renderCard = ({ handlerRef, cardTransY, cardClock, cardState, cardConfig, cardGestureState, index, color, scale, translateX, translateY, zIndex, rotateY, rotateX, size, perspective }, i) => {
    // @NOTE: PanGestureHandler should not directly wrap an element that can rotate completely on edge.
    // this causes values to go to infinity.
    return (
      <PanGestureHandler
        key={`card-${i}`}
        ref={handlerRef}
        simultaneousHandlers={this.mainHandler}
        onGestureEvent={event([{
          nativeEvent: ({ translationY }) => block([
            set(cardTransY, translationY),
          ])
        }])}
        onHandlerStateChange={event([{
          nativeEvent: ({ state }) => block([
            cond(
              and(neq(state, State.ACTIVE), eq(cardGestureState, State.ACTIVE)), [
                startClock(cardClock),
            ]),
            cond(and(eq(state, State.ACTIVE), clockRunning(cardClock)), [
              stopClock(cardClock),
              set(cardState.position, 1),
              set(cardState.finished, 0),
              set(cardState.time, 0),
              set(cardState.velocity, 0),
              set(cardTransY, 0),
            ]),
            set(cardGestureState, state),
          ])
        }])}
      >
      <Animated.View style={{ 
        zIndex, 
        translateX, 
        translateY, 
        flex: 1, 
        backgroundColor: 'teal', 
        position: 'absolute', 
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Animated.View
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
            translateY: block([
              cond(and(clockRunning(cardClock), cardState.finished), [
                stopClock(cardClock),
                set(cardState.position, 1),
                set(cardState.finished, 0),
                set(cardState.time, 0),
                set(cardState.velocity, 0),
                set(cardTransY, 0),
              ]),
              cond(clockRunning(cardClock), [
                spring(cardClock, cardState, cardConfig),
                multiply(add(translateY, cardTransY), cardState.position),
              ], [
                add(translateY, cardTransY),
              ]),
            ]),
            scaleX: scale,
            scaleY: scale,
            rotateY,
            rotateX,
          }]
        }}
      >
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold'}}>{}</Text>
      </Animated.View>
      </Animated.View>
      </PanGestureHandler>
    )
  }

  velocity = new Value(0)

  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}>
        <TapGestureHandler
          onHandlerStateChange={event([
            {nativeEvent: ({ state }) => block([
              cond(eq(state, State.BEGAN), [ 
                cond(clockRunning(this.clock), [
                  set(this.altState.position, this._temp),
                  startClock(this.altClock),
                  stopClock(this.clock),
                  set(this.prevTrans, add(this.prevTrans, this.animState.position)),
                  set(this.animState.position, 0),
                  set(this.animState.time, 0),
                  set(this.animState.frameTime, 0),
                  set(this.animState.finished, 0)
                ])
              
              ])
            ])}
          ])}
        >
        <Animated.View style={{ flex: 1 }}>
        <PanGestureHandler
        ref={this.mainHandler}
          onGestureEvent={event([{
            nativeEvent: ({ translationX: x, velocityX, state }) => block([
              cond(eq(this.gestureState, State.ACTIVE), [
                set(this.translationX, x),
                set(this.velocity, velocityX),
              ])
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
                    set(this.animState.position, 0),
                    set(this.animState.frameTime, 0),
                    set(this.animState.finished, 0)
                  ]),
                ]),

                cond(eq(this.gestureState, State.END),
                  [
                    set(this.prevTrans, add(this.translationX, this.prevTrans)),
                    // debug('END velocity:', this.velocity),
                    // debug('END prevTrans:', this.prevTrans),
                    // debug('END transX:', this.translationX),
                    set(this.translationX, 0),
                    cond(clockRunning(this.clock), [
                      stopClock(this.clock),
                      set(this.animState.time, 0),
                      set(this.animState.position, 0),
                      set(this.animState.frameTime, 0),
                      set(this.animState.finished, 0)
                    ]),
                    cond(greaterThan(abs(this.velocity), 0), [
                      set(this.animConfig.toValue, this.velocity),
                      set(this.animConfig.duration, 5000),
                      // debug('configured', this.animConfig.toValue),
                      set(this.animState.time, 0),
                      set(this.animState.position, 0),
                      set(this.animState.frameTime, 0),
                      set(this.animState.finished, 0),
                      // debug('starting clock: to:', this.animConfig.toValue),
                      // debug('from current pos:', this.prevTrans),
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