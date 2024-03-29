import Animated from 'react-native-reanimated';
import { State } from 'react-native-gesture-handler';

let {
  cond,
  interpolateNode: interpolate,
  proc,
  multiply,
  add,
  sub,
  block,
  set,
  modulo,
  divide,
  lessThan,
  or,
  greaterThan,
  and,
  not,
  neq,
  eq,
} = Animated;

if (!proc) {
  proc = (fn) => fn;
}

const resetSpring = proc((time, position, finished, velocity) =>
  block([set(time, 0), set(position, 0), set(finished, 0), set(velocity, 0)])
);

const transToIndex = proc((cumulativeTrans, tickHeight, index, numCards) =>
  modulo(
    interpolate(cumulativeTrans, {
      inputRange: [multiply(-1, tickHeight), 0, tickHeight],
      outputRange: [sub(index, 1), index, add(index, 1)],
    }),
    numCards
  )
);

export const indexToTrans = proc((transToIndex, numCards, size) =>
  sub(
    interpolate(transToIndex, {
      inputRange: [0, 0.5, 0.75, 1, numCards],
      outputRange: [0, size, multiply(size, 1.9), multiply(size, 1.25), 0],
    }),
    60
  )
);

const scaleXY = proc((transToIndex, numCards, scale) =>
  interpolate(transToIndex, {
    inputRange: [0, 0.25, 0.5, 1, numCards],
    outputRange: [
      scale,
      multiply(scale, 1.2),
      multiply(scale, 1.24),
      divide(scale, 2),
      scale,
    ],
    extrapolate: Animated.Extrapolate.CLAMP,
  })
);

const zIndex = proc((transToIndex, numCards) =>
  interpolate(transToIndex, {
    inputRange: [0, 0.7, 0.75, 1, numCards],
    outputRange: [999, 999, 0, 0, 333],
    extrapolate: Animated.Extrapolate.CLAMP,
  })
);

// Go forward or backward to tapped card
// depending on which requires fewer moves
const setDiffIndex = proc(
  (
    diffIndex,
    activeIndex,
    colorIndex,
    numCards,
    diffTrans,
    tickHeight,
    toValue,
    tempOffset
  ) =>
    block([
      set(
        diffIndex,
        cond(
          lessThan(
            modulo(sub(colorIndex, activeIndex), numCards),
            modulo(sub(activeIndex, colorIndex), numCards)
          ),
          // Go forward
          modulo(sub(colorIndex, activeIndex), numCards),
          // Go backwards
          multiply(modulo(sub(activeIndex, colorIndex), numCards), -1)
        )
      ),
      set(diffTrans, multiply(tickHeight, diffIndex)),
      set(toValue, diffTrans),
      set(tempOffset, diffTrans),
    ])
);

// if translate amt is greater than tickHeight / 2 or is fling gesture
// snap to next index, otherwise snap back to current index
const setSprConfig = proc(
  (toValue, velocity, flingThresh, prevTrans, tickHeight, tempOffset) =>
    set(
      toValue,
      cond(
        or(
          greaterThan(velocity, flingThresh), // Fling down
          and(
            not(lessThan(velocity, multiply(flingThresh, -1))), // Fling up
            greaterThan(modulo(prevTrans, tickHeight), divide(tickHeight, 2))
          )
        ),

        // snap to next index
        set(tempOffset, sub(tickHeight, modulo(prevTrans, tickHeight))),
        // snap to current index
        set(tempOffset, multiply(modulo(prevTrans, tickHeight), -1))
      )
    )
);

const gestureIsEnded = proc((gestureState, state) =>
  and(neq(gestureState, State.END), eq(state, State.END))
);

const onPanGestureEvent = proc(
  (gestureState, translationY, y, velocity, velocityY) =>
    cond(eq(gestureState, State.ACTIVE), [
      set(translationY, y),
      set(velocity, velocityY),
    ])
);

const getActiveIndex = proc((cumulativeTrans, tickHeight, numCards) =>
  interpolate(modulo(cumulativeTrans, multiply(tickHeight, numCards)), {
    inputRange: [0, tickHeight],
    outputRange: [0, 1],
  })
);

const setPrevTrans = proc((prevTrans, position) =>
  set(prevTrans, add(prevTrans, position))
);

export default {
  zIndex,
  scaleXY,
  transToIndex,
  indexToTrans,
  resetSpring,
  setDiffIndex,
  setSprConfig,
  gestureIsEnded,
  onPanGestureEvent,
  getActiveIndex,
  setPrevTrans,
};
