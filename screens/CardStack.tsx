import React, { Component } from 'react'
import { View, Dimensions, Text, Platform, Animated as RNAnimated, SafeAreaView } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'
import { Transition } from 'react-navigation-fluid-transitions'


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
} = Animated;

const numCards = 7
const tickHeight = height * 0.75
const flingThresh = 500

class CardStack extends Component {

  _mounted: Animated.Value<number>
  mainHandler: React.RefObject<PanGestureHandler>
  translationY: Animated.Value<number>
  prevTrans: Animated.Value<number>
  cumulativeTrans: Animated.Node<number>
  gestureState: Animated.Value<State>
  perspective: Animated.Value<number>
  auto: Animated.Value<number>
  clock: Animated.Clock
  sprState: Animated.SpringState
  sprConfig: Animated.SpringConfig
  _tempOffset: Animated.Value<number>
  activeIndex: Animated.Node<number>


  constructor(props) {
    super(props)
    this.mainHandler = React.createRef()
    this.translationY = new Value(0)
    this.prevTrans = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.perspective = new Value(850)
    this.auto = new Value(0)
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

    this._tempOffset = new Value(0)
    this.cumulativeTrans = add(this.prevTrans, this.translationY, this.sprState.position)

    this.activeIndex = Animated.interpolate(modulo(this.cumulativeTrans, tickHeight * numCards), {
      inputRange: [0, tickHeight],
      outputRange: [0, 1],
    })

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)
      const index = new Value(i)
      const size = width * 0.75
      const gestureState = new Value(0)

      const resetSpring = [
        set(this.sprState.time, 0),
        set(this.sprState.position, 0),
        set(this.sprState.finished, 0),
        set(this.sprState.velocity, 0),
        set(this.prevTrans, add(this._tempOffset, this.prevTrans)),
      ]

      const runClock = cond(clockRunning(this.clock), [
        spring(this.clock, this.sprState, this.sprConfig),
        cond(eq(this.sprState.finished, 1), [
          resetSpring,
          stopClock(this.clock),
        ]),
        cond(not(this._mounted), stopClock(this.clock))
      ])

      const scale = new Value(1)
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

      const iosConfig = {
        inputRange: [0, 0.5, 1, 2, arr.length],
        outputRange: [60, 0, 80, 70, 60],
      }

      const androidConfig = {
        inputRange: [0, 0.5, 1, 2, arr.length],
        outputRange: [70, 0, 35, 50, 70],
      }

      const rotateX = Animated.concat(
        Animated.interpolate(transToIndex, isAndroid ? androidConfig : iosConfig), 'deg')

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
        index: colorIndex,
        gestureState,
      }
    })
  }


  diffIndex = new Value(0)
  diffTrans = new Value(0)

  renderCard = ({ color, scale, translateY, zIndex, rotateX, size, gestureState, index }, i) => {
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
          transform: [{
            perspective: this.perspective,
            translateY,
            scaleX: scale,
            scaleY: scale,
            rotateX,
          }]
        }}
      >
        <TapGestureHandler
          onHandlerStateChange={event([
            {
              nativeEvent: ({ state }) => block([

                cond(and(eq(state, State.END), neq(gestureState, State.END)), [
                  cond(clockRunning(this.clock), [
                    stopClock(this.clock),
                    set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
                    set(this.sprState.position, 0),
                    set(this.sprState.time, 0),
                    set(this.sprState.velocity, 0),
                    set(this.sprState.finished, 0),
                  ]),

                  // Go forward or backward to tapped card
                  // depending on which requires fewer moves
                  set(this.diffIndex, [
                    cond(lessThan(
                      modulo(sub(index, this.activeIndex), numCards),
                      modulo(sub(this.activeIndex, index), numCards)
                    ), [
                      // Go forward
                      modulo(sub(index, this.activeIndex), numCards),
                    ], [
                      // Go backwards
                      multiply(modulo(sub(this.activeIndex, index), numCards), -1),
                    ])
                  ]),
                  set(this.diffTrans, multiply(tickHeight, this.diffIndex)),
                  set(this.sprConfig.toValue, this.diffTrans),
                  set(this._tempOffset, this.diffTrans),
                  startClock(this.clock),
                ]),

                cond(and(eq(state, State.FAILED), neq(gestureState, State.FAILED)), [
                  debug('failed', new Value(index)),
                ]),

                set(gestureState, state),
              ])
            }
          ])}
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
        </TapGestureHandler>
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
        <SafeAreaView style={{ flex: 1 }}>


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
                cond(and(eq(state, State.ACTIVE), clockRunning(this.clock)), [
                  stopClock(this.clock),
                  set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
                  set(this.sprState.position, 0),
                  set(this.sprState.time, 0),
                  set(this.sprState.velocity, 0),
                  set(this.sprState.finished, 0),
                ]),

                cond(and(neq(this.gestureState, State.END), eq(state, State.END)), [
                  set(this.prevTrans, add(this.translationY, this.prevTrans)),

                  // if translate amt is greater than tickHeight / 2 or is fling gesture
                  // snap to next index, otherwise snap back to current index
                  set(this.sprConfig.toValue, cond(
                    [
                      or(
                        greaterThan(this.velocity, flingThresh), // Fling down
                        and(
                          not(lessThan(this.velocity, -flingThresh)), // Fling up
                          greaterThan(modulo(this.prevTrans, tickHeight), tickHeight / 2),
                        )
                      )
                    ],
                    [
                      // snap to next index
                      set(this._tempOffset, sub(tickHeight, modulo(this.prevTrans, tickHeight))),
                    ], [
                    // snap to current index
                    set(this._tempOffset, multiply(modulo(this.prevTrans, tickHeight), -1)),
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
              alignItems: 'center',
            }}>
              {this.cards.map(this.renderCard)}
            </Animated.View>
          </PanGestureHandler>
        </SafeAreaView>
        <BackButton />
      </View>
    )
  }
}

export default CardStack