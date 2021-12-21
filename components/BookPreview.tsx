import * as React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { State } from 'react-native-gesture-handler'


const {
  cond,
  add,
  multiply,
  greaterThan,
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
  min,
  max,
} = Animated;

const numCards = 7
const rampDist = 100

class Book extends React.Component {

  constructor(props) {
    super(props)
    const { width: screenWidth, height: screenHeight } = props
    const width = screenWidth * .4
    const height = width * 2
    this.perspective = new Value(850)
    this.rawTrans = new Value(0)

    this.prevTrans = new Value(width)
    this.gestureState = new Value(State.UNDETERMINED)


    this.transX = multiply(this.rawTrans, this.panPct)


    this.cumulativeTrans = add(this.transX, this.prevTrans)
    const panRange = width * 2
    this.cardPanWidth = panRange / numCards
    this.currentIndex = divide(this.cumulativeTrans, this.cardPanWidth)



    this.panIndex = new Value(0)
    this.cards = [...Array(numCards)].fill(0).map((d, index, arr) => {
      const colorMultiplier = 255 / (arr.length)
      // const color = `rgba(${index * colorMultiplier}, ${Math.abs(128 - index * colorMultiplier)}, ${255 - (index * colorMultiplier)}, 0.9)`

      const rotateY = Animated.interpolateNode(this.currentIndex, {
        inputRange: [index - 1.25, index, index + 1.25],
        outputRange: [0, Math.PI / 2, Math.PI],
        extrapolate: Animated.Extrapolate.CLAMP,
      })

      const zIndex = Animated.interpolateNode(this.currentIndex, {
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
          transform: [
            {scaleX: 0.8},
            {scaleY: 0.8},
          ]
        }}
      >
        <Animated.View style={{
          width: width * 2,
          height,
          transform: [
            {perspective: this.perspective},
            {rotateY},
          ]
        }} >
          <Animated.View style={{
            opacity: 0.85,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            backgroundColor: color,
            width: width,
            height,
          }}>
            <Text style={{ color: 'seashell', fontSize: 24, fontWeight: 'bold' }}>{}</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    )
  }

  render() {
    const { width } = this.props
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderRadius: width,
        overflow: 'hidden',
      }}>
       
          <Animated.View style={{
            ...StyleSheet.absoluteFillObject,
          }}>
            <Animated.View style={{
              ...StyleSheet.absoluteFillObject,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [
                {perspective: this.perspective},
                {rotateX: Math.PI / 12 + "deg"},
              ]
            }}>
              {this.cards.map(this.renderCard)}
            </Animated.View>
          </Animated.View>
      </View>
    )
  }
}

export default Book