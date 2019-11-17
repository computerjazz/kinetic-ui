import React from 'react'
import { Dimensions, View, StyleSheet, Text, SafeAreaView } from 'react-native'
import Animated from 'react-native-reanimated'
import { PanGestureHandler, State, TapGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler'

import BackButton from '../components/BackButton'

const { width: screenWidth } = Dimensions.get("window")

const {
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
  divide,
  block,
  round,
  startClock,
  stopClock,
  clockRunning,
  sub,
  Value,
  Clock,
  event,
  abs,
  color,
  max,
  min,
  onChange,
  debug,
} = Animated;

const numCards = 7
const rampDist = 100

class Book extends React.Component {

  _mounted: Animated.Value<number>
  perspective: Animated.Value<number>
  rawTrans: Animated.Value<number>
  prevTrans: Animated.Value<number>
  gestureState: Animated.Value<State>
  absPan: Animated.Value<number>
  panPct: Animated.Adaptable<number>
  transX: Animated.Adaptable<number>
  clock: Animated.Clock
  sprState: Animated.SpringState
  sprConfig: Animated.SpringConfig
  centerClock: Animated.Clock
  centerSprState: Animated.SpringState
  centerSprConfig: Animated.SpringConfig
  cumulativeTrans: Animated.Node<number>
  cardPanWidth: number
  currentIndex: Animated.Node<number>
  onTapStateChange: (e: TapGestureHandlerStateChangeEvent) => void
  onGestureEvent: (e: PanGestureHandlerGestureEvent) => void
  onHandlerStateChange: (e: PanGestureHandlerStateChangeEvent) => void
  cards


  constructor(props) {
    super(props)
    const width = screenWidth * .4
    const height = width * 2
    this._mounted = new Value(1)

    this.perspective = new Value(850)
    this.rawTrans = new Value(0)
    this.prevTrans = new Value(width)
    this.gestureState = new Value(State.UNDETERMINED)
    this.absPan = new Value(0)

    this.panPct = Animated.interpolate(this.absPan, {
      inputRange: [0, rampDist],
      outputRange: [0, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    this.transX = multiply(this.rawTrans, this.panPct)

    this.clock = new Clock()

    this.sprState = {
      position: new Value(0),
      velocity: new Value(0),
      finished: new Value(0),
      time: new Value(0),
    }

    this.sprConfig = {
      damping: 8,
      mass: 1,
      stiffness: 50.296,
      overshootClamping: false,
      toValue: new Value(1),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    }

    this.centerClock = new Clock()
    this.centerSprState = {
      position: this.prevTrans,
      velocity: new Value(0),
      finished: new Value(0),
      time: new Value(0),
    }

    this.centerSprConfig = {
      damping: 8,
      mass: 1,
      stiffness: 50.296,
      overshootClamping: false,
      toValue: new Value(1),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    }

    const runCenterClock = [
      cond(clockRunning(this.centerClock), [
        spring(this.centerClock, this.centerSprState, this.centerSprConfig),
        cond(
          or(
            this.centerSprState.finished,
            not(this._mounted)

          ), [
          stopClock(this.centerClock),
          set(this.centerSprState.velocity, 0),
          set(this.centerSprState.time, 0),
          set(this.centerSprState.finished, 0),
        ])
      ]),
      this.centerSprState.position,
    ]

    this.cumulativeTrans = add(this.transX, runCenterClock)
    const panRange = width * 2
    this.cardPanWidth = panRange / numCards
    this.currentIndex = divide(this.cumulativeTrans, this.cardPanWidth)

    const runClock = [
      cond(clockRunning(this.clock), [
        spring(this.clock, this.sprState, this.sprConfig),
        cond(or(
          this.sprState.finished,
          not(this._mounted)
        ), [
          stopClock(this.clock),
          set(this.sprState.velocity, 0),
          set(this.sprState.finished, 0),
          set(this.sprState.time, 0),
        ])
      ]),
      this.sprState.position,
    ]

    this.cards = [...Array(numCards)].fill(0).map((d, index, arr) => {
      const colorMultiplier = 255 / (arr.length)
      // const color = `rgba(${index * colorMultiplier}, ${Math.abs(128 - index * colorMultiplier)}, ${255 - (index * colorMultiplier)}, 0.9)`

      const rotateY = Animated.interpolate(this.currentIndex, {
        inputRange: [index - 1.25, index, index + 1.25],
        outputRange: [0, Math.PI / 2, Math.PI],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const zIndex = Animated.interpolate(this.currentIndex, {
        inputRange: [index - 1, index, index + 1],
        outputRange: [-999 - index, 999, -999 + index],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const colorIndex = cond(
        greaterThan(index, this.currentIndex),
        index,
        index + 1,
      )

      const c = multiply(colorIndex, colorMultiplier)
      const r = round(c)
      const g = round(abs(sub(128, c)))
      const b = round(sub(255, c))
      const cardColor = color(r, g, b)

      const toVal = cond(lessThan(this.currentIndex, index), 0, Math.PI)

      const springRotateY = add(
        multiply(runClock, toVal),
        multiply(sub(1, runClock), rotateY),
      )

      return {
        color: cardColor,
        width,
        height,
        rotateY: springRotateY,
        zIndex,
      }
    })

    const tapState = new Value(State.UNDETERMINED)

    this.onGestureEvent = event([{
      nativeEvent: ({ translationX }) => block([
        cond(eq(this.gestureState, State.ACTIVE), [
          cond(
            or(
              and(
                greaterThan(this.currentIndex, -1),
                lessThan(this.currentIndex, numCards),
              ),
              and(
                not(greaterThan(this.currentIndex, -1)),
                greaterThan(translationX, this.rawTrans),
              ),
              and(
                not(lessThan(this.currentIndex, numCards)),
                lessThan(translationX, this.rawTrans),
              )
            ), [
            set(this.absPan,
              add(
                this.absPan,
                abs(sub(this.rawTrans, translationX)),
              )
            ),
            set(this.rawTrans, translationX),
          ]
          ),
          cond(
            clockRunning(this.clock), [
            stopClock(this.clock),
            set(this.sprState.finished, 0),
            set(this.sprState.time, 0),
            set(this.sprState.velocity, 0),
          ]),
          cond(
            clockRunning(this.centerClock), [
            stopClock(this.centerClock),
            set(this.centerSprState.finished, 0),
            set(this.centerSprState.time, 0),
            set(this.centerSprState.velocity, 0),
          ]),
          cond(
            greaterThan(this.sprState.position, 0),
            set(
              this.sprState.position,
              max(0, multiply(this.sprState.position, .5)),
            ),
          ),
        ])
      ])
    }])

    this.onHandlerStateChange = event([{
      nativeEvent: ({ state }) => block([
        cond(and(eq(this.gestureState, State.ACTIVE), neq(state, State.ACTIVE)), [
          set(this.centerSprConfig.toValue, add(
            multiply(floor(this.currentIndex), this.cardPanWidth),
            this.cardPanWidth / 2,
          ),
          ),
          set(this.prevTrans, add(this.prevTrans, this.transX)),
          set(this.rawTrans, 0),
          set(this.absPan, 0),
          startClock(this.centerClock),
          startClock(this.clock)
        ]),
        set(this.gestureState, state),

      ])
    }])

    const minMax = (val, minVal, maxVal) => min(maxVal, max(minVal, val))

    this.onTapStateChange = event([{
      nativeEvent: ({ state, x }) => block([
        set(tapState, state),
        onChange(tapState, [
          cond(eq(tapState, State.END), [
            debug('val', add(this.currentIndex, cond(greaterThan(x, screenWidth / 2), -1, 1))),

            set(this.absPan, 0),
            set(this.rawTrans, 0),
            set(this.sprState.position, 0),
            set(this.centerSprConfig.toValue,
              multiply(
                this.cardPanWidth,
                minMax(
                  add(this.currentIndex, cond(greaterThan(x, screenWidth / 2), -1, 1)),
                  -0.5,
                  numCards - 0.5,
                ),
              ),
            ),
            startClock(this.centerClock)

          ])
        ])
      ])
    }])


  }

  componentDidMount() {
    this.willBlurSub = this.props.navigation.addListener('willBlur', () => {
      this._mounted.setValue(0)
    })
  }

  componentWillUnmount() {
    this.willBlurSub && this.willBlurSub.remove()
  }

  renderCard = ({ color, width, height, rotateY, zIndex }, index) => {
    return (
      <Animated.View
        key={`book-card-${index}`}
        style={{
          position: 'absolute',
          width: width * 2,
          height,
          zIndex,
        }}
      >
        <Animated.View style={{
          width: width * 2,
          height,
          transform: [{
            perspective: this.perspective,
            rotateY,
          }]
        }}
        >

          <Animated.View style={{
            opacity: 0.85,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            backgroundColor: color,
            width: width,
            height,
          }} />
        </Animated.View>
      </Animated.View>
    )
  }

  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
      }}>
        <SafeAreaView style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={this.onGestureEvent}
            onHandlerStateChange={this.onHandlerStateChange}
          >
            <Animated.View style={{
              ...StyleSheet.absoluteFillObject,
            }}>
              <TapGestureHandler
                onHandlerStateChange={this.onTapStateChange}
              >
                <Animated.View style={{
                  ...StyleSheet.absoluteFillObject,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{
                    perspective: this.perspective,
                    rotateX: Math.PI / 12,
                  }]
                }}>
                  {this.cards.map(this.renderCard)}
                </Animated.View>
              </TapGestureHandler>

            </Animated.View>
          </PanGestureHandler>
        </SafeAreaView>
        <BackButton />
      </View>
    )
  }
}

export default Book