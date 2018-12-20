import React, { Component } from 'react';
import { Dimensions, Image, Text, View, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

import BackButton from '../components/BackButton'

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
  block,
  startClock,
  stopClock,
  clockRunning,
  sub,
  defined,
  Value,
  Clock,
  event,
  sin,
} = Animated;

class Head extends Component {

  constructor(props) {
    super(props);

    const TOSS_SEC = 0.2;
    const dragX = new Value(0);
    const dragY = new Value(0);
    const gestureState = new Value(-1);
    const dragVX = new Value(0);
    const dragVY = new Value(0);
    const scaleXY = new Value(0);

    this._onGestureEvent = event([
      {
        nativeEvent: {
          translationX: dragX,
          translationY: dragY,
          velocityX: dragVX,
          velocityY: dragVY,
          state: gestureState,
        },
      },
    ]);

    const scaleSmall = 1
    const scaleBig = 2

    const transX = new Value(68);
    const transY = new Value(143);
    const clock = new Clock();
    const clock2 = new Clock();
    const springVal = new Value(scaleBig)
    const prevDragX = new Value(0);
    const prevDragY = new Value(0);


    const state = {
      finished: new Value(0),
      velocity: dragVX,
      position: new Value(0),
      time: new Value(0),
    };


    const scaleState = {
      finished: new Value(0),
      velocity: scaleXY,
      position: new Value(1),
      time: new Value(0),
    };

    const scaleConfig = {
      damping: 22,
      mass: 1,
      stiffness: 550,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
      toValue: springVal,
    };

    const isActive = eq(gestureState, State.ACTIVE)

    const startClockIfStopped = c => cond(clockRunning(c), 0, startClock(c))
    const scaledDown = () => lessThan(scaleConfig.toValue, scaleBig)
    const scaledUp = () => greaterThan(scaleConfig.toValue, scaleSmall)

    this._scale = block([
      cond(
        isActive, // if active 
        [
          cond(scaledDown(), [ // if the toValue is less than large scale, set to large
            set(scaleConfig.toValue, scaleBig),
            startClockIfStopped(clock2)
          ])
        ],
        [
          cond(scaledUp(), [
            set(scaleConfig.toValue, scaleSmall),
            startClockIfStopped(clock2)
          ]),
        ]
      ),
      [
        spring(clock2, scaleState, scaleConfig),
        cond(state.finished, stopClock(clock2)), // if finished, stop the clock
        scaleState.position,
      ]
    ])


    this._transY = block([
      cond(isActive, 
        [
          set(transY, add(transY, sub(dragY, prevDragY))),
          set(prevDragY, dragY),
        ],
        set(prevDragY, 0) 
      ),
      cond(Platform.OS === 'ios' ? 1 : 0, multiply(transY, scaleBig), transY)
,
    ]);

    this._transX = block([
      cond(isActive, 
        [
          set(transX, add(transX, sub(dragX, prevDragX))),
          set(prevDragX, dragX), 
        ],
        set(prevDragX, 0) 
      ),
      cond(Platform.OS === 'ios' ? 1 : 0, multiply(transX, scaleBig), transX)

    ]);
  }

  renderImage = () => (
    <PanGestureHandler
      maxPointers={1}
      onGestureEvent={this._onGestureEvent}
      onHandlerStateChange={this._onGestureEvent}>
      <Animated.View
        style={[
          styles.box,
          {
            transform: [
              {
                translateX: this._transX,
                translateY: this._transY,
                scale: this._scale,
              },
            ],
          },
        ]}
      />
    </PanGestureHandler>
  )

  render() {
    return (
      <View style={styles.container}>
        {this.renderImage()}
        <BackButton onPress={() => this.props.navigation.goBack(null)} />
      </View>
    )
  }
}

export default Head

const headSize = 80

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  box: {
    position: 'absolute',
    width: headSize,
    height: headSize,
    borderRadius: headSize / 2,
    backgroundColor: 'tomato',
  },
});