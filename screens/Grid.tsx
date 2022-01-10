import React, { useState } from 'react';
import {
  Dimensions,
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, { concat } from 'react-native-reanimated';
import BackButton from '../components/BackButton';
import {
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Procs } from '../procs/grid';
import spring from '../procs/springFill';
const { width, height } = Dimensions.get('window');

const screenSize = Math.min(width, height)

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
  debug,
  call,
} = Animated;

if (!proc) {
  proc = (fn) => fn;
}

const isAndroid = Platform.OS === 'android';

const cardsPerRow = 8;
const engageDist = screenSize / 8;

const numCards = Math.pow(cardsPerRow, 2);
const cardSize = (screenSize - 2) / Math.sqrt(numCards);
const padding = cardSize / 20;

type Props = {};

type Card = {
  color: string;
  rotateX: Animated.Node<number>;
  rotateY: Animated.Node<number>;
  scale: Animated.Node<number>;
};

class Grid extends React.Component<Props> {
  mountTimer = Date.now();

  pan: Animated.Value<number>;
  gestureState: Animated.Value<State>;
  translationX: Animated.Value<number>;
  translationY: Animated.Value<number>;
  screenX: Animated.Value<number>;
  screenY: Animated.Value<number>;
  clock: Animated.Clock;
  sprState: Animated.SpringState;
  sprConfig: Animated.SpringConfig;
  panRatio: Animated.Node<number>;
  cards: Card[];
  onGestureEvent: (event: PanGestureHandlerGestureEvent) => void;
  onHandlerStateChange: (event: PanGestureHandlerGestureEvent) => void;
  onTapStateChange: (event: any) => void;
  tapState: Animated.Value<State>;

  constructor(props: any) {
    super(props);
    this.pan = new Value(0);
    this.tapState = new Value(State.UNDETERMINED);
    this.gestureState = new Value(State.UNDETERMINED);
    this.translationX = new Value(0);
    this.translationY = new Value(0);
    this.screenX = new Value(0);
    this.screenY = new Value(0);
    this.clock = new Clock();

    this.sprState = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    this.sprConfig = {
      damping: 20,
      mass: 0.3,
      stiffness: 30,
      overshootClamping: false,
      toValue: new Value(0),
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    };

    this.panRatio = 1;

    const multiplier = this.sprState.position;
    const colorMultiplier = 255 / numCards;

    this.cards = [...Array(numCards)].fill(0).map((_d, i) => {
      const row = Math.floor(i / cardsPerRow);
      const col = i - cardsPerRow * row;
      const centerY = cardSize * row + cardSize / 2;
      const centerX = cardSize * col + cardSize / 2;
      const diffXRatio = Procs.diffXRatio(centerX, this.screenX);
      const diffYRatio = Procs.diffYRatio(centerY, this.screenY);

      const pctY = Procs.pct(diffYRatio);
      const pctX = Procs.pct(diffXRatio);

      const color = `rgba(${i * colorMultiplier}, ${Math.abs(
        128 - i * colorMultiplier
      )}, ${255 - i * colorMultiplier}, 0.9)`;

      return {
        color,
        rotateX: Procs.mult(Procs.rotateX(diffYRatio), pctX, multiplier),
        rotateY: Procs.mult(Procs.rotateY(diffXRatio), pctY, multiplier),
        scale: Procs.scale(pctX, pctY, multiplier),
      };
    });

    this.onGestureEvent = event([
      {
        nativeEvent: ({ translationX, translationY, x, y }) =>
          block([
            cond(eq(this.gestureState, State.ACTIVE), [
              Procs.setPan(
                this.pan,
                this.translationX,
                translationX,
                this.translationY,
                translationY
              ),
              set(this.screenX, x),
              set(this.screenY, y),
            ]),
          ]),
      },
    ]);

    this.onTapStateChange = event([
      {
        nativeEvent: ({ state, oldState, x, y }) =>
          block([
            cond(eq(state, State.BEGAN), [
              cond(clockRunning(this.clock), stopClock(this.clock)),
              set(this.screenX, x),
              set(this.screenY, y),
              set(this.sprConfig.toValue, 1),
              startClock(this.clock),
            ]),
            cond(eq(state, State.END), [
              set(this.sprConfig.toValue, 0),
              startClock(this.clock),
            ]),
          ]),
      },
    ]);

    this.onHandlerStateChange = event([
      {
        nativeEvent: ({ state, oldState }) =>
          block([
            cond(and(neq(state, oldState), eq(state, State.END)), [
              cond(clockRunning(this.clock), stopClock(this.clock)),
              set(this.sprConfig.toValue, 0),
              startClock(this.clock),
            ]),
            set(this.gestureState, state),
          ]),
      },
    ]);
  }

  panRef = React.createRef();
  tapRef = React.createRef();
  longPressRef = React.createRef();

  render() {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.center}>
            <LongPressGestureHandler
              ref={this.longPressRef}
              minDurationMs={100}
              maxDist={0}
              simultaneousHandlers={[
                this.longPressRef,
                this.tapRef,
                this.panRef,
              ]}
              onHandlerStateChange={this.onTapStateChange}>
              <Animated.View>
                <TapGestureHandler
                  ref={this.tapRef}
                  onHandlerStateChange={this.onTapStateChange}
                  simultaneousHandlers={[
                    this.longPressRef,
                    this.tapRef,
                    this.panRef,
                  ]}>
                  <Animated.View>
                    <PanGestureHandler
                      ref={this.panRef}
                      simultaneousHandlers={[
                        this.longPressRef,
                        this.tapRef,
                        this.panRef,
                      ]}
                      onGestureEvent={this.onGestureEvent}
                      onHandlerStateChange={this.onHandlerStateChange}>
                      <Animated.View style={styles.cardContainer}>
                        {this.cards.map((item) => (
                          <GridItem {...item} />
                        ))}
                      </Animated.View>
                    </PanGestureHandler>
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </LongPressGestureHandler>
          </View>
        </SafeAreaView>
        <BackButton />
        <Animated.Code>
          {() =>
            cond(clockRunning(this.clock), [
              spring(this.clock, this.sprState, this.sprConfig),
              cond(this.sprState.finished, [
                stopClock(this.clock),
                set(this.sprState.finished, 0),
              ]),
            ])
          }
        </Animated.Code>
      </View>
    );
  }
}

export default Grid;

const GridItem = ({ color, rotateX, rotateY, scale }, index) => {
  const [opacity, setOpacity] = useState(1);
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
          opacity,
          backgroundColor: color,
          borderRadius: cardSize / 10,
          transform: [
            { rotateX: Animated.concat(rotateX, 'rad') },
            { rotateY: Animated.concat(rotateY, 'rad') },
            { scaleX: scale },
            { scaleY: scale },
          ],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'seashell',
    width: cardsPerRow * cardSize,
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
  },
});
