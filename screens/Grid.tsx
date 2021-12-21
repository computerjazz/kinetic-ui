import React from 'react'
import { Dimensions, View, SafeAreaView, StyleSheet, Platform } from 'react-native'
import Animated, { concat } from 'react-native-reanimated'
import BackButton from '../components/BackButton'
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Procs } from '../procs/grid';
import spring from '../procs/springFill'
const { width } = Dimensions.get('window')

let {
  and,
  set,
  neq,
  cond,
  eq,
  add,
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  Value,
  Clock,
  event,
  abs,
  min,
  interpolateNode: interpolate,
  proc,
} = Animated;

if (!proc) {
  proc = (fn) => fn
}

const isAndroid = Platform.OS === "android"

const cardsPerRow = 8
const engageDist = width / 8

const numCards = Math.pow(cardsPerRow, 2)
const cardSize = width / Math.sqrt(numCards)
const padding = cardSize / 20

type Props = {

}

type Card = {
  color: string
  rotateX: Animated.Node<number>
  rotateY: Animated.Node<number>
  scale: Animated.Node<number>
}

class Grid extends React.Component<Props> {

  mountTimer = Date.now()

  pan: Animated.Value<number>
  gestureState: Animated.Value<State>
  translationX: Animated.Value<number>
  translationY: Animated.Value<number>
  screenX: Animated.Value<number>
  screenY: Animated.Value<number>
  clock: Animated.Clock
  sprState: Animated.SpringState
  sprConfig: Animated.SpringConfig
  panRatio: Animated.Node<number>
  cards: Card[]
  onGestureEvent: (event: PanGestureHandlerGestureEvent) => void
  onHandlerStateChange: (event: PanGestureHandlerGestureEvent) => void

  constructor(props) {
    super(props)
    this.pan = new Value(0)
    this.gestureState = new Value(State.UNDETERMINED)
    this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.screenX = new Value(0)
    this.screenY = new Value(0)
    this.clock = new Clock()

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

    this.panRatio = interpolate(this.pan, {
      inputRange: [0, engageDist],
      outputRange: [0, 1],
      extrapolate: Animated.Extrapolate.CLAMP,
    })

    const multiplier = min(add(this.panRatio, this.sprState.position), 1)
    const colorMultiplier = 255 / numCards

    this.cards = [...Array(numCards)].fill(0).map((_d, i) => {
      const row = Math.floor(i / cardsPerRow)
      const col = i - (cardsPerRow * row)
      const centerY = cardSize * row + cardSize / 2
      const centerX = cardSize * col + cardSize / 2
      const diffXRatio = Procs.diffXRatio(centerX, this.screenX)
      const diffYRatio = Procs.diffYRatio(centerY, this.screenY)

      const pctY = Procs.pct(diffYRatio)
      const pctX = Procs.pct(diffXRatio)

      const color = `rgba(${i * colorMultiplier}, ${Math.abs(128 - i * colorMultiplier)}, ${255 - (i * colorMultiplier)}, 0.9)`

      return {
        color,
        rotateX: Procs.mult(Procs.rotateX(diffYRatio), pctX, multiplier),
        rotateY: Procs.mult(Procs.rotateY(diffXRatio), pctY, multiplier),
        scale: Procs.scale(pctX, pctY, multiplier)
      }
    })

    this.onGestureEvent = event([{
      nativeEvent: ({ translationX, translationY, x, y }) => block([
        cond(eq(this.gestureState, State.ACTIVE), [
          cond(clockRunning(this.clock), [
            stopClock(this.clock),
            Procs.reset(this.sprState.finished, this.sprState.velocity, this.sprState.time, this.sprState.position),
          ]),
          Procs.setPan(this.pan, this.translationX, translationX, this.translationY, translationY),
          set(this.screenX, x),
          set(this.screenY, y),
        ])
      ])
    }])

    this.onHandlerStateChange = event([{
      nativeEvent: ({ state }) => block([
        cond(and(neq(state, State.ACTIVE), eq(this.gestureState, State.ACTIVE)), [
          set(this.sprState.position, this.panRatio),
          set(this.pan, 0),
          set(this.translationX, 0),
          set(this.translationY, 0),
          startClock(this.clock),
        ]),
        set(this.gestureState, state)
      ])
    }])
  }

  renderCard = ({ color, rotateX, rotateY, scale }, index) => {
    return (
      <View
        key={`grid-card-${index}`}
        style={{
          width: cardSize,
          height: cardSize,
          padding,
        }}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: color,
            borderRadius: cardSize / 10,
            transform: [
              { rotateX: isAndroid ? concat(rotateX, "deg") : rotateX },
              { rotateY: isAndroid ? concat(rotateY, "deg") : rotateY },
              { scaleX: scale },
              { scaleY: scale },
            ]
          }}
        />
      </View>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.center}>
            <PanGestureHandler
              onGestureEvent={this.onGestureEvent}
              onHandlerStateChange={this.onHandlerStateChange}
            >
              <Animated.View style={styles.cardContainer}>
                {this.cards.map(this.renderCard)}
              </Animated.View>
            </PanGestureHandler>
          </View>
        </SafeAreaView>
        <BackButton />
        <Animated.Code>
          {() => cond(clockRunning(this.clock), [
            spring(this.clock, this.sprState, this.sprConfig),
            cond(this.sprState.finished, [
              stopClock(this.clock),
              Procs.reset(this.sprState.finished, this.sprState.velocity, this.sprState.time, this.sprState.position),
              set(this.screenX, 0),
              set(this.screenY, 0),
            ])
          ])}
        </Animated.Code>
      </View>
    )
  }
}

export default Grid

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'seashell',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  }
})