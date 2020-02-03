import React, { Component } from 'react'
import { View, Dimensions, Platform, SafeAreaView } from 'react-native'
import Animated from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import BackButton from '../components/BackButton'

const { width, height } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android'
import spring from '../procs/springFill'
import procs from '../procs/stack'
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
  divide,
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  Value,
  Clock,
  event,
  modulo,
  interpolate,
  concat,
} = Animated;

const numCards = 7
const tickHeight = height * 0.75
const flingThresh = 500

type Card = {
  color: string,
  rotateX: Animated.Node<string>
  zIndex: Animated.Node<number>
  scale: Animated.Node<number>
  translateY: Animated.Node<number>
  size: number
  onTapStateChange: (e: TapGestureHandlerStateChangeEvent) => void
}

class CardStack extends Component {

  cards: Card[]
  _mounted: Animated.Value<number>
  mainHandler: React.RefObject<PanGestureHandler>
  translationY: Animated.Value<number>
  prevTrans: Animated.Value<number>
  cumulativeTrans: Animated.Node<number>
  gestureState: Animated.Value<State>
  perspective: Animated.Value<number>
  auto: Animated.Value<number>
  clock: Animated.Clock
  sprState: Animated.SpringState = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  }
  sprConfig: Animated.SpringConfig = {
    damping: 20,
    mass: 0.3,
    stiffness: 30,
    overshootClamping: false,
    toValue: new Value(0),
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  }
  _tempOffset: Animated.Value<number>
  activeIndex: Animated.Node<number>

  onPanGestureEvent: (e: PanGestureHandlerGestureEvent) => void
  onPanStateChange: (e: PanGestureHandlerStateChangeEvent) => void

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

    this._tempOffset = new Value(0)
    this.cumulativeTrans = add(this.prevTrans, this.translationY, this.sprState.position)
    const { time, position, finished, velocity } = this.sprState

    this.activeIndex = Animated.interpolate(modulo(this.cumulativeTrans, tickHeight * numCards), {
      inputRange: [0, tickHeight],
      outputRange: [0, 1],
    })

    this.onPanGestureEvent = event([{
      nativeEvent: ({ translationY: y, velocityY }) => procs.onPanGestureEvent(this.gestureState, this.translationY, y, this.velocity, velocityY)
    }])

    this.onPanStateChange = event([{
      nativeEvent: ({ state }) => block([
        cond(and(eq(state, State.ACTIVE), clockRunning(this.clock)), [
          stopClock(this.clock),
          set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
          procs.resetSpring(time, position, finished, velocity),
        ]),

        cond(procs.gestureIsEnded(this.gestureState, state), [
          set(this.prevTrans, add(this.translationY, this.prevTrans)),
          procs.setSprConfig(
            this.sprConfig.toValue,
            this.velocity,
            flingThresh,
            this.prevTrans,
            tickHeight,
            this._tempOffset,
            ),
          startClock(this.clock),
          set(this.translationY, 0),
        ]),
        set(this.gestureState, state),
      ])
    }]
    )

    const size = width * 0.75

    const iosConfig = {
      inputRange: [0, 0.5, 1, 2, numCards],
      outputRange: [60, 0, 80, 70, 60],
    }

    const androidConfig = {
      inputRange: [0, 0.5, 1, 2, numCards],
      outputRange: [70, 0, 35, 50, 70],
    }

    this.cards = [...Array(numCards)].fill(0).map((d, i, arr) => {
      const colorMultiplier = 255 / (numCards - 1)
      const index = new Value(i)
      const gestureState = new Value(0)

      const scale = new Value(1)
      const transToIndex = procs.transToIndex(this.cumulativeTrans, tickHeight, index, numCards)
      const translateY = procs.indexToTrans(transToIndex, numCards, size)
      const rotateX = concat(interpolate(transToIndex, isAndroid ? androidConfig : iosConfig), 'deg')
      const scaleXY = procs.scaleXY(transToIndex, numCards, scale)
      const zIndex = procs.zIndex(transToIndex, numCards)

      // Somehow the top of the stack ended up as index 0
      // but the next item down is numCards - 1
      // for example, indices would go
      // 0
      // 4
      // 3
      // 2
      // 1
      // `colorIndex` compensates for this
      const maxIndex = numCards - 1
      const colorIndex = maxIndex - (i + maxIndex) % numCards

      const onTapStateChange = event([
        {
          nativeEvent: ({ state }) => block([
            cond(and(eq(state, State.END), neq(gestureState, State.END)), [
              cond(clockRunning(this.clock), [
                stopClock(this.clock),
                set(this.prevTrans, add(this.prevTrans, this.sprState.position)),
                procs.resetSpring(time, position, finished, velocity)
              ]),
              procs.setDiffIndex(this.diffIndex, this.activeIndex, colorIndex, numCards),
              set(this.diffTrans, multiply(tickHeight, this.diffIndex)),
              set(this.sprConfig.toValue, this.diffTrans),
              set(this._tempOffset, this.diffTrans),
              startClock(this.clock),
            ]),
            set(gestureState, state),
          ])
        }
      ])
      return {
        color: `rgba(${colorIndex * colorMultiplier}, ${Math.abs(128 - colorIndex * colorMultiplier)}, ${255 - (colorIndex * colorMultiplier)}, 0.9)`,
        scale: scaleXY,
        zIndex,
        translateY,
        size,
        rotateX,
        onTapStateChange
      }
    })
  }


  diffIndex = new Value(0)
  diffTrans = new Value(0)

  renderCard = ({ color, scale, translateY, zIndex, rotateX, size, onTapStateChange }, i) => {
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
          onHandlerStateChange={onTapStateChange}
        >
          <Animated.View style={{ flex: 1, width: size }} />
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
            onGestureEvent={this.onPanGestureEvent}
            onHandlerStateChange={this.onPanStateChange}
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
        <Animated.Code>
          {() => cond(clockRunning(this.clock), [
            spring(this.clock, this.sprState, this.sprConfig),
            cond(eq(this.sprState.finished, 1), [
              procs.resetSpring(
                this.sprState.time, this.sprState.position, this.sprState.finished, this.sprState.velocity),
              set(this.prevTrans, add(this._tempOffset, this.prevTrans)),
              stopClock(this.clock),
            ]),
            cond(not(this._mounted), stopClock(this.clock))
          ])}
        </Animated.Code>
      </View>
    )
  }
}

export default CardStack