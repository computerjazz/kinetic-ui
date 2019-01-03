import React, { Component } from 'react'
import { View, Dimensions, Text, Platform } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'


const { width, height } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android'

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
} = Animated;

const numCards = 7
const tickHeight = height * 0.75
const flingThresh = 500

class Deck extends Component {

  constructor() {
    super()
    this.mainHandler = React.createRef()
    this.translationY = new Value(0)
    this.prevTrans = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this.clock = new Clock()
    this._mounted = new Value(1)


    this.sprState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    }

      this.sprConfig = {
        damping: 20,
        mass: 0.3,
        stiffness: 30,
        overshootClamping: false,
        toValue: new Value(0),
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
      }

    const resetSpring = [
      set(this.sprState.time, 0),
      set(this.sprState.position, this.sprConfig.toValue),
      set(this.sprState.finished, 0),
      set(this.sprState.velocity, 0),
      set(this.prevTrans, this.sprConfig.toValue),
      debug('reset: pos', this.sprState.position),
      debug('reset: trans', this.prevTrans),
      debug('reset: tOVal', this.sprConfig.toValue),
    ]

    const runClock = cond(clockRunning(this.clock), [
      spring(this.clock, this.sprState, this.sprConfig),
      cond(eq(this.sprState.finished, 1), [
        resetSpring,
        stopClock(this.clock),
      ]),
      this.sprState.position
    ])

    this.cumulativeTrans = add(this.translationY, this.prevTrans, runClock)
    const ry = Animated.interpolate(this.cumulativeTrans, {
      inputRange: [0, height],
      outputRange: [0, 1],
    })

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)
      const index = new Value(i)
      const size = width * 0.75
      const gestureState = new Value(0)
      const midpoint = (arr.length - 1) / 2
      const maxIndex = arr.length - 1


      // 0: 10
      // 1: 5
      // 2: 0
      // 3: 5
      // 4: 10
      // midpoint: 2
      //

      // const maxY = height / (i + 1.75)
      const multiplier = (midpoint - i) / arr.length
      const maxY = multiplier * height



      const iy = Animated.interpolate(ry, {
        inputRange: [0, 1],
        outputRange: [i * 5, maxY],
      })

      // const x = cos(multiply(ry, multiplier))
      const x = cos(i / arr.length)

      const ix = Animated.interpolate([debug(`index ${i} x`, x), x], {
        inputRange: [-.5, 0, .5],
        outputRange: [0, 0, 0], 
      })

      const rotateZ = Animated.interpolate(ry, {
        inputRange: [0, 1],
        outputRange: [0, multiplier * Math.PI / 2],
      })


      const scale = Animated.interpolate(ry, {
        inputRange: [0, 1],
        outputRange: [1 - (i * .01), 1],
      })
    
      const colorIndex = i
      return {
        color: `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`,
        scale,
        zIndex: -i,
        translateY: iy,
        translateX: ix,
        size,
        index: colorIndex,
        gestureState,
        rotateZ,
      }
    })
  }


  renderCard = ({ color, scale, translateY, translateX, zIndex, size, rotateZ, gestureState, index }, i) => {
    return (
      <Animated.View
        key={`card-${i}`}

        style={{
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          width: size,
          height: size / 2,
          backgroundColor: color,
          borderRadius: 10,
          zIndex,
          opacity: 0.8,
          transform: [{
            perspective: this.perspective,
            translateY,
            translateX,
            scaleX: scale,
            scaleY: scale,
            rotateZ,
          }]
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

  velocity = new Value(0)

  componentDidMount() {
    this.willBlurSub = this.props.navigation.addListener('willBlur', () => {
      this._mounted.setValue(0)
    })
  }

  componentWillUnmount() {
    this.willBlurSub && this.willBlurSub.remove()
  }

  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}>

        <PanGestureHandler
          ref={this.mainHandler}
          onGestureEvent={event([{
            nativeEvent: ({ translationY: y, velocityY, state }) => block([
              cond(eq(this.gestureState, State.ACTIVE), [
                set(this.translationY, y),
                set(this.velocity, velocityY),
              ])
            ])
          }])}
          onHandlerStateChange={event([{
            nativeEvent: ({ state, velocityY }) => block([
              cond(
                and(
                  eq(this.gestureState, State.ACTIVE), 
                  neq(state, State.ACTIVE),
                ), [
                set(this.prevTrans, add(this.prevTrans, this.translationY)),
                set(this.translationY, 0),
                set(this.sprState.position, this.prevTrans),
                set(this.prevTrans, 0),
                cond(
                  greaterThan(abs(this.sprState.position), height / 4),
                   [
                  set(this.sprConfig.toValue, cond(greaterThan(this.sprState.position, 0), [height / 2], [-height / 2])),
                ], [
                  set(this.sprConfig.toValue, 0),
                ]),
                startClock(this.clock),
              ]),
              cond(and(eq(state, State.ACTIVE), clockRunning(this.clock)), [
                stopClock(this.clock),
                set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
                set(this.sprState.position, 0),
                set(this.sprState.time, 0),
                set(this.sprState.velocity, 0),
                set(this.sprState.finished, 0),
              ]),

              set(this.gestureState, state),
            ])
          }]
          )}
        >

          <Animated.View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {this.cards.map(this.renderCard)}
          </Animated.View>
        </PanGestureHandler>
        <BackButton color="#ddd"

          onPress={() => {
            this.props.navigation.goBack(null)
          }} />
      </View>

    )
  }
}

export default Deck