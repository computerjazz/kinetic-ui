import Animated from 'react-native-reanimated'
import { State } from 'react-native-gesture-handler'
const { or, eq, add, neq, cond, clockRunning, startClock } = Animated

export const followTouch = (p, xy) => [
  add(p[xy], p[`start${xy.toUpperCase()}`])
]
export const hasMoved = (p) => or(neq(p.x, 0), neq(p.y, 0))

export const startClockIfStopped = c => cond(clockRunning(c), 0, startClock(c))

export const isActive = p => or(eq(p.gestureState, State.ACTIVE), eq(p.gestureState, State.BEGAN))


