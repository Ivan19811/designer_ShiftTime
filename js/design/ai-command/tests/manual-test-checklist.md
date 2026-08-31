# Parser-only manual test checklist

## Purpose
This checklist is the human verification layer for the AI command parser. It does not validate DOM mutations. It validates parser understanding only.

## How to use
1. Open the parser debug panel.
2. Paste one command.
3. Run parse.
4. Compare the JSON result with the expected intent, target, property, value, scope, state, and responsive flags.
5. Mark pass / fail.
6. If failed, note which layer failed:
   - normalizer
   - tokenizer
   - action resolver
   - target resolver
   - property resolver
   - value resolver
   - scope resolver
   - state resolver
   - responsive resolver
   - clarifier

## Priority groups

### Group A — must pass first
- bg_001
- bg_002
- gr_001
- gr_004
- tx_001
- tx_003
- ic_002
- bs_004
- sc_001
- st_005
- mn_004
- am_001
- cl_001

### Group B — gradient understanding
- gr_002
- gr_006
- gr_007
- gr_010
- gr_011
- gc_001
- gc_003

### Group C — typo tolerance
- am_001
- am_002
- am_003
- am_004
- am_005
- am_007
- am_008

### Group D — ambiguity / clarify behavior
- cl_001
- cl_002
- cl_003
- cl_004
- cl_005
- cl_006

## Pass criteria
A command is a pass when:
- action is correct
- target is correct or reasonably defaulted
- property is correct
- value is correct enough for executor handoff
- scope/state/responsive are correctly detected when present
- unclear commands set `needsClarify: true`

## Fail tagging template
- Command ID:
- Input:
- Expected:
- Actual:
- Failed layer:
- Notes:
