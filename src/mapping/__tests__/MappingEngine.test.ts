import { describe, it, expect, beforeEach } from 'vitest'
import { MappingEngine } from '../MappingEngine'
import { useAppStore } from '../../state/store'

let engine: MappingEngine

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState())
  engine = new MappingEngine()
})

describe('MappingEngine', () => {
  it('getValue returns default when no mapping', () => {
    expect(engine.getValue('osc.frequency', 60)).toBe(60)
  })

  it('resolves single mapping', () => {
    useAppStore.getState().setAnalysis([], 0.5)
    useAppStore.getState().addMapping({
      id: 't1', source: 'envelope', target: 'osc.frequency',
      range: [20, 200], smooth: 0, curve: 'linear',
    })
    engine.tick()
    expect(engine.getValue('osc.frequency')).toBe(110)
  })

  it('param returns callable', () => {
    const fn = engine.param('x', 42)
    expect(typeof fn).toBe('function')
    expect(fn()).toBe(42)
  })

  it('reset clears values', () => {
    useAppStore.getState().setAnalysis([], 1)
    useAppStore.getState().addMapping({
      id: 't1', source: 'envelope', target: 'x',
      range: [0, 100], smooth: 0, curve: 'linear',
    })
    engine.tick()
    expect(engine.getValue('x')).toBe(100)
    engine.reset()
    expect(engine.getValue('x', 0)).toBe(0)
  })
})
