
import React, { Component } from 'react';
import { Dimensions, Image, Text, View, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Animated, { EasingNode as Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import MenuTitle from '../components/MenuTitle'



let {
  add,
  multiply,
  sub,
  Value,
  Clock,
  round,
  abs,
  color,
} = Animated;


class Dot extends Component {

  constructor(props) {
    super(props);
    const { width, height } = props


    const dropZoneRadius = width / 4
    const translateX = width / 2 - dropZoneRadius / 2
    const translateY = height / 2 - dropZoneRadius / 2

    this.dropZoneRadius = dropZoneRadius
    this.translateX = translateX
    this.translateY = translateY

    const dotSize = width / 5
    this.dotSize = dotSize

    const numDots = 7
    const ringScales = {
      disabled: 0,
      in: 2,
      out: 15,
    }

    this.dropZoneRotate = 0

    this.scaleConfig = {
      easing: Easing.linear,
      toValue: Math.PI * 2,
      duration: new Value(1000),
    }

    this.scaleVal = new Value(0.05)

    this.dropZoneScale = 1

    this.dots = [...Array(numDots)].map((d, index, arr) => {
      const colorMultiplier = 255 / (arr.length - 1)

      const clock = new Clock();

      const dragX = new Value(0);
      const dragY = new Value(0);
      const ratio = index / arr.length

      const startX = Math.sin(ratio * Math.PI * 2) * dropZoneRadius * 1.15
      const startY = Math.cos(ratio * Math.PI * 2) * dropZoneRadius * 1.15
      
      const prevX = new Value(0);
      const prevY = new Value(0);

      const dotScaleState = {
        finished: new Value(0),
        velocity: new Value(0),
        position: new Value(0.001),
        time: new Value(0),
      };

      const dotScaleConfig = {
        damping: 22,
        mass: 1,
        stiffness: 550,
        overshootClamping: false,
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
        toValue: new Value(1),
      };

      const c = multiply(index, colorMultiplier)
      const r = round(c)
      const g = round(abs(sub(128, c)))
      const b = round(sub(255, c))
      const dotColor = color(r, g, b)

      const x = {
        start: startX,
        prev: prevX,
        drag: dragX,
        translate: startX,
      }

      const y = {
        start: startY,
        prev: prevY,
        drag: dragY,
        translate: startY,
      }
      const intersects = false
      
      const endClock = new Clock
      const endDisabled = 0.01
      const endState = {
        disabled: endDisabled,
        position: new Value(endDisabled),
        finished: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
      }
   
      // Ring
      // Ring animation
      const ringR = new Value(0)
      const ringG = new Value(0)
      const ringB = new Value(0)
      const ringA = new Value(0)

      const ringClock = new Clock()
      const ringState = {
        position: new Value(0.001),
        time: new Value(0),
        finished: new Value(0),
        velocity: new Value(0),
      }
      const ringConfig = {
        damping: 22,
        mass: 1,
        stiffness: 55,
        overshootClamping: false,
        restSpeedThreshold: 0.001,
        restDisplacementThreshold: 0.001,
        toValue: new Value(ringScales.in),
      }

      const ringScale = 0

      const ringColor = color(ringR, ringG, ringB, ringA)
      const ringOpacity = 0

      const ring = {
        clock: ringClock,
        state: ringState,
        config: ringConfig,
        scale: sub(add(this.dropZoneScale, ringScale), 1),
        r: ringR,
        g: ringG,
        b: ringB,
        a: ringA,
        color: ringColor,
        rgb: {
          r: ringR,
          g: ringG,
          b: ringB,
          a: ringA,
        },
        opacity: ringOpacity
      }


      const scale = 1

      return {
        gestureState: new Value(State.UNDETERMINED),
        zIndex: new Value(999),
        intersects,
        x,
        y,
        scale: {
          clock: clock,
          value: scale,
          state: dotScaleState,
          config: dotScaleConfig,
        },
        clock,
        endClock,
        endState,
        color: dotColor,
        rgb: {r, g, b},
        ring,
      }
    })
  }

  renderDot = ({ 
    x,
    y,
    color,
    scale, 
    zIndex,
  }, i) => {

    return (


        <Animated.View
        key={`dot-${i}`}
          style={{
            flex: 1,
            position: 'absolute',
            width: this.dotSize,
            height: this.dotSize,
            zIndex,
            transform: [
              {translateX: x.translate},
              {translateY: y.translate},
            ]
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              opacity: 0.85,
              width: this.dotSize,
              height: this.dotSize,
              borderRadius: this.dotSize / 2,
              backgroundColor: color,
              transform: [
                {scaleX: 1},
                {scaleY: 1},
              ]
            }}
          />
 
        </Animated.View>
    )
  }

  render() {
    const { width, height } = this.props
    return (
      <Animated.View 
      style={{
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
          }}>
        {this.dots.map(this.renderDot)}
        </Animated.View>
        </Animated.View>
      </Animated.View>
    )
  }
}

export default Dot

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'seashell',
    overflow: 'hidden',
  },
});