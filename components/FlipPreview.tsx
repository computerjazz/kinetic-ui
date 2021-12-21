import * as React from 'react'
import { View, Platform, Text } from 'react-native'
import Animated, { Easing } from 'react-native-reanimated'
const {
  Value,
  modulo,
  add,
  sub,
  multiply,
  divide,
  startClock,
  stopClock,
  clockRunning,
  cond,
  set,
  timing,
  round,
  color,
  floor,
  abs,
} = Animated

class FlipPreview extends React.Component {

  constructor({ clock, focused, width }) {
    super()
    const size = width / 2
    const numCards = 7
    const maxIndex = numCards - 1
    const colorMultiplier = 255 / maxIndex
    this.startIndexY = new Value(0)

    this.translationX = new Value(0)
    this.translationY = new Value(0)
    this.prevX = new Value(0)
    this.prevY = new Value(0)


    const previewState = {
      finished: new Value(0),
      position: new Value(0),
      time: new Value(0),
      frameTime: new Value(0),
    }

    const previewConfig = {
      toValue: size * numCards,
      duration: 20000,
      easing: Easing.linear,
    }

    const runClock = [
      cond(clockRunning(clock), [
        timing(clock, previewState, previewConfig),
        cond(previewState.finished, [
          stopClock(clock),
          set(previewState.finished, 0),
          set(previewState.time, 0),
          set(previewState.frameTime, 0),
          set(previewState.position, 0),
          startClock(clock),
        ])
      ], [
        startClock(clock),
      ]),
      previewState.position
    ]

    this._cy = add(this.prevY, this.translationY)
    this._cx = add(
      this.prevX,
      this.translationX,
      cond(focused, runClock, 0)
    )

    this._iy = Animated.interpolateNode(this._cy, {
      inputRange: [-size, 0, size],
      outputRange: [180, 0, -180],
    })

    this._ix = Animated.interpolateNode(this._cx, {
      inputRange: [-size, 0, size],
      outputRange: [-180, 0, 180],
    })

    this.indexX = floor(divide(add(this._ix, 90), 180))
    this.indexY = floor(divide(add(this._iy, 90), 180))
    this.index = add(this.indexX, this.indexY)

    this.targetX = multiply(size, this.indexX)
    this.targetY = multiply(size, this.indexY, -1)

    this._mx = sub(modulo(add(this._ix, 90), 180), 90)
    this._my = sub(modulo(add(this._iy, 90), 180), 90)

    this._isInverted = modulo(sub(this.startIndexY, this.indexY), 2)

    this.rotateX = Animated.concat(this._my, 'deg')
    this.rotateY = Animated.concat([
      cond(this._isInverted, multiply(this._mx, -1), this._mx),
    ], 'deg')

    const colorIndex = sub(maxIndex, modulo(add(this.index, maxIndex), numCards))

    const c = multiply(colorIndex, colorMultiplier)
    const r = round(c)
    const g = round(abs(sub(128, c)))
    const b = round(sub(255, c))
    this.color = color(r, g, b)

    this.perspective = new Value(850)

    this.springState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    this.springConfig = {
      damping: 8,
      mass: 1,
      stiffness: 50.296,
      overshootClamping: false,
      toValue: new Value(1),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    };


    this.diffX = new Value(0)
    this.diffY = new Value(0)
    this._px = new Value(0)
    this._py = new Value(0)

    this._x = this.rotateX
    this._y = this.rotateY
  }

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
          transform: [
            {perspective: new Value(850)},
            {translateY},
            {scaleX: scale},
            {scaleY: scale},
            {rotateX},
          ]
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
  render() {
    const { height, width } = this.props
    const size = width / 2
    return (

      <View style={{
        flex: 1,
        backgroundColor: 'seashell',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderRadius: width,
        overflow: 'hidden',
      }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: height / 2,
            right: width / 2,
            width: size * .75,
            height: size * .75,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 5,
            zIndex: -999,
            transform: [
              {
                perspective: this.perspective,
                rotateX: this._x,
                rotateY: this._y,
              }]
          }}
        />
        <Animated.View
          style={{
            opacity: 0.8,
            justifyContent: 'center',
            alignItems: 'center',
            width: size,
            height: size,
            backgroundColor: this.color,
            borderRadius: 5,
            transform: [
              {
                perspective: this.perspective,
                rotateX: this._x,
                rotateY: this._y,
              }]
          }}
        />
      </View>
    )
  }
}

export default FlipPreview