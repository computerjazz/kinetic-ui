import React, { Component } from 'react'
import { View, Dimensions } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'

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
} = Animated;

const numCards = 7
const tickHeight = height * 0.75
console.log('thresh', tickHeight / 2)

class CardStack extends Component {

  constructor() {
    super()
    this.translationY = new Value(0)
    this.prevTrans = new Value(0)
    this.cumulativeTrans = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this.activeCardIndex = new Value(0)
    this.auto = new Value(0)
    this.clock = new Clock()

    this.sprState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    },

      this.sprConfig = {
        damping: 20,
        mass: 0.3,
        stiffness: 30,
        overshootClamping: false,
        toValue: new Value(0),
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
      },

    this._tempOffset = new Value(0)


    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)
      const index = new Value(i)
      const size = width * 0.75

      const resetSpring = [
        set(this.sprState.time, 0),
        set(this.sprState.position, 0),
        set(this.sprState.finished, 0),
        set(this.sprState.velocity, 0),
        set(this.prevTrans, add(this._tempOffset, this.prevTrans)),
        // debug('reset: pos', this.sprState.position),
        // debug('reset: temp', this._tempOffset),
        // debug('reset: prevtrans', this.prevTrans),
        // debug('reset: translationY', this.translationY),
      ]

      const runClock = cond(clockRunning(this.clock), [
          spring(this.clock, this.sprState, this.sprConfig),
          cond(eq(this.sprState.finished, 1), [
            resetSpring,
            stopClock(this.clock),
          ])
       
      ])

      const scale = new Value(1)
      this.cumulativeTrans = add(this.prevTrans, this.translationY, this.sprState.position)

      const interpolatedY = Animated.interpolate(this.cumulativeTrans, {
        inputRange: [-tickHeight, 0, tickHeight],
        outputRange: [sub(index, 1), index, add(index, 1)],
      })

      const transToIndex = modulo(interpolatedY, arr.length)
      const indexToTrans = sub(Animated.interpolate([
        runClock,
        transToIndex,
      ], {
          inputRange: [0, 0.5, 0.75, 1, arr.length],
          outputRange: [0, size, size * 1.9, size * 1.25, 0],
        }), 60)

      const translateY = indexToTrans

      const rotateX = Animated.concat(
        Animated.interpolate(transToIndex, {
          inputRange: [0, 0.5, 1, 2, arr.length],
          outputRange: [80, 0, 75, 80, 80],
        }), 'deg')

      const scaleXY = Animated.interpolate(transToIndex, {
        inputRange: [0, 0.25, 0.5, 1, arr.length],
        outputRange: [scale, multiply(scale, 1.2), multiply(scale, 1.24), divide(scale, 2), scale],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const zIndex = Animated.interpolate(transToIndex, {
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
      }
    })

  }

  renderCard = ({ color, scale, translateY, zIndex, rotateX, size }, i) => {
    return (
      <Animated.View
        key={`card-${i}`}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 10,
          zIndex,
          transform: [{
            perspective: new Value(850),
            translateY,
            scaleX: scale,
            scaleY: scale,
            rotateX,
          }]
        }}
      />
    )
  }

  velocity = new Value(0)


  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}>
        <PanGestureHandler
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
              cond(and(eq(state, State.ACTIVE), clockRunning(this.clock)), [
                // debug('stopping clock', this.sprState.position),
                stopClock(this.clock),
                set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
                set(this.sprState.position, 0),
                set(this.sprState.time, 0),
                set(this.sprState.velocity, 0),
                set(this.sprState.finished, 0),
              ]),

              cond(and(neq(this.gestureState, State.END), eq(state, State.END)), [
                set(this.prevTrans, add(this.translationY, this.prevTrans)),
                // debug('end prev', this.prevTrans),
                // debug('END trans!', this.translationY),
                // debug('end mod', modulo(this.prevTrans, tickHeight)),

                // if translate amt is greater than tickHeight / 2, snap to next index
                // otherwise snap back to current index
                set(this.sprConfig.toValue, cond(
                  [
                    greaterThan(modulo(this.prevTrans, tickHeight), tickHeight / 2)
                  ],
                  [
                    set(this._tempOffset, sub(tickHeight, modulo(this.prevTrans, tickHeight))),
                    // debug('gt temp!', this._tempOffset),
                  ], [
                    set(this._tempOffset, multiply(modulo(this.prevTrans, tickHeight), -1)),
                    // debug('less temp!', this._tempOffset),
                  ])
                ),
                startClock(this.clock),

                set(this.translationY, 0),
              ]),
              set(this.gestureState, state),
            ])
          }]
          )}
        >
          <Animated.View style={{
            flex: 1,
            marginTop: 50,
            alignItems: 'center'
          }}>
            {this.cards.map(this.renderCard)}
          </Animated.View>
        </PanGestureHandler>
        <BackButton color="#ddd" onPress={() => this.props.navigation.goBack(null)} />
      </View>
    )
  }
}

export default CardStack