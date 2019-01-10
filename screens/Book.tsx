import * as React from 'react'
import { Dimensions, View, StyleSheet } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
import { PanGestureHandler, State } from 'react-native-gesture-handler'

import BackButton from '../components/BackButton'

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

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
  color,
} = Animated;

const numCards = 7
console.log("Active", State.ACTIVE)
console.log('Began', State.BEGAN)
console.log('Canceled', State.CANCELLED)
console.log('END', State.END)
console.log('UNDETERMINED', State.UNDETERMINED)

class Book extends React.Component {

  constructor(props) {
    super(props)
    const width = screenWidth * .4
    const height = width * 2
    this.perspective = new Value(850)
    this.transX = new Value(0)
    this.prevTrans = new Value(width / 2)
    this.gestureState = new Value(State.UNDETERMINED)



    this.cumulativeTrans = add(this.transX, this.prevTrans)
    const transToIndex = Animated.interpolate(this.cumulativeTrans, {
      inputRange: [0, width],
      outputRange: [0, numCards]
    })

    this.panIndex = new Value(0)
    this.cards = [...Array(numCards)].fill(0).map((d, index, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)
      // const color = `rgba(${index * colorMultiplier}, ${Math.abs(128 - index * colorMultiplier)}, ${255 - (index * colorMultiplier)}, 0.9)`

      const rotateY = Animated.interpolate(transToIndex, {
        inputRange: [index - 2, index, index + 2],
        outputRange: [0, Math.PI / 2, Math.PI],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const zIndex = Animated.interpolate(transToIndex, {
        inputRange: [index - 1, index, index + 1],
        outputRange: [-999 - index, 999, -999 + index],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const colorIndex = cond(
          greaterThan(index, transToIndex), [
            index-1
          ],
          index
      )

      const c = multiply(colorIndex, colorMultiplier)
      const r = round(c)
      const g = round(abs(sub(128, c)))
      const b = round(sub(255, c))
      const cardColor = color(r, g, b)

      return {
        color: cardColor,
        width,
        height,
        rotateY,
        zIndex,
      }
    })
  }

  renderCard = ({ color, width, height, rotateY, translateX, translateY, zIndex }, index) => {


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
        }} >
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
        <PanGestureHandler
          onGestureEvent={event([{
            nativeEvent: ({ translationX, state }) => block([
              cond(eq(this.gestureState, State.ACTIVE), [
                set(this.transX, translationX),
              ])
            ])
          }])}
          onHandlerStateChange={event([{
            nativeEvent: ({ state }) => block([
              cond(and(eq(this.gestureState, State.ACTIVE), neq(state, State.ACTIVE)), [
                set(this.prevTrans, add(this.prevTrans, this.transX)),
                set(this.transX, 0),
              ]),
              set(this.gestureState, state),

            ])
          }])}
        >
          <Animated.View style={{
            ...StyleSheet.absoluteFillObject,
          }}>
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
          </Animated.View>
        </PanGestureHandler>
        <BackButton onPress={() => this.props.navigation.goBack()} />
      </View>
    )
  }
}

export default Book