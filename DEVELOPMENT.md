# ComputeXplain - Development Engineering Logs

This document tracks the incremental building steps, unit tests, and performance profiles of the simulators.

### Log #9: refactor(network): optimize Dijkstra path search lookup times
- **Summary**: Network path search optimized for faster calculations.
- **Status**: Verified & Integrated successfully.

### Log #10: feat(network): add customizable packet loss ratios in gateway
- **Summary**: Gateway now supports custom packet drop rates from UI.
- **Status**: Verified & Integrated successfully.

### Log #11: docs(network): explain TCP congestion window expansion models
- **Summary**: Added details about TCP slide windows to docs.
- **Status**: Verified & Integrated successfully.

### Log #12: test(network): write integration test for DNS response time
- **Summary**: Verified DNS mock server latency parameters.
- **Status**: Verified & Integrated successfully.

### Log #13: style(network): enhance visual glow on active router hops
- **Summary**: Fitted neon color shadows on nodes with active canvas pulses.
- **Status**: Verified & Integrated successfully.

### Log #14: perf(network): throttle canvas redraw cycles during congestion
- **Summary**: Reduces repaint rates under high load.
- **Status**: Verified & Integrated successfully.

### Log #15: fix(network): prevent routing loop between ISP A and ISP B
- **Summary**: Resolved cyclic routing loops in network graph.
- **Status**: Verified & Integrated successfully.

### Log #16: chore(network): document DNS server mock IP mapping parameters
- **Summary**: Described the 8.8.8.8 and 1.1.1.1 DNS resolutions.
- **Status**: Verified & Integrated successfully.

### Log #17: feat(network): show sequence tracking list inside package visual
- **Summary**: Number labels added to flying packet nodes.
- **Status**: Verified & Integrated successfully.

### Log #18: refactor(network): modularize hop calculation algorithms
- **Summary**: Split Dijktra path finder into reusable functions.
- **Status**: Verified & Integrated successfully.

### Log #19: fix(network): handle client retransmission on severed link
- **Summary**: TCP retry starts immediately if destination path is broken.
- **Status**: Verified & Integrated successfully.

### Log #20: docs(network): clarify TCP packet sequence number reassembly
- **Summary**: Added details about buffer indexing inside index.html.
- **Status**: Verified & Integrated successfully.

### Log #21: style(network): set cursor hover change on active network nodes
- **Summary**: Mouse turns to pointer when hovering routers.
- **Status**: Verified & Integrated successfully.

### Log #22: test(network): unit test TCP payload segmenting boundaries
- **Summary**: Verified that 3-character splitting works for all lengths.
- **Status**: Verified & Integrated successfully.

### Log #23: perf(network): cache link coordinates to reduce CPU calculations
- **Summary**: Coordinate values are now calculated once during init.
- **Status**: Verified & Integrated successfully.

### Log #24: feat(network): log network transactions to bottom console feed
- **Summary**: All routing events are now logged with timestamps.
- **Status**: Verified & Integrated successfully.

### Log #25: fix(network): handle out-of-order packet reassembly offsets
- **Summary**: Fixed offset issues when packet 3 arrives before packet 1.
- **Status**: Verified & Integrated successfully.

### Log #26: docs(network): describe TCP handshake protocol simulation steps
- **Summary**: Handshake visual steps are documented.
- **Status**: Verified & Integrated successfully.

### Log #27: style(network): dim offline routers visually in network tree
- **Summary**: Dashed lines and red accents for congested links.
- **Status**: Verified & Integrated successfully.

### Log #28: test(network): simulate severe 60% packet drop environment
- **Summary**: Tested retransmission threshold boundaries.
- **Status**: Verified & Integrated successfully.

### Log #29: chore(network): update DNS lookup host mapping dictionary keys
- **Summary**: Added custom URLs like github.com and wikipedia.org.
- **Status**: Verified & Integrated successfully.

### Log #30: feat(network): support custom payloads instead of HELLO WORLD
- **Summary**: User input field is now active in left dashboard panel.
- **Status**: Verified & Integrated successfully.

### Log #31: refactor(network): restructure router nodes array initialization
- **Summary**: Normalized node declarations into coordinate definitions.
- **Status**: Verified & Integrated successfully.

### Log #32: fix(network): clear routing arrays on reset trigger click
- **Summary**: Flushed active packets lists during manual reset.
- **Status**: Verified & Integrated successfully.

### Log #33: docs(network): draft packet routing visualization guides
- **Summary**: Completed networking documentation section.
- **Status**: Verified & Integrated successfully.

### Log #34: feat(cpu): add Multiply-by-Addition loop program preset
- **Summary**: Added multiplication loop assembly preset.
- **Status**: Verified & Integrated successfully.

### Log #35: feat(cpu): add Factorial calculator program preset
- **Summary**: Added factorial loop assembly preset.
- **Status**: Verified & Integrated successfully.

### Log #36: refactor(cpu): isolate instruction fetch and decode cycles
- **Summary**: Clean separation of fetch and decode logic in cpu-sim.js.
- **Status**: Verified & Integrated successfully.

### Log #37: style(cpu): light up active registers in purple during execute
- **Summary**: Registers flash during execution step.
- **Status**: Verified & Integrated successfully.

### Log #38: perf(cpu): throttle SVG animations to save CPU power
- **Summary**: Reduced DOM repaints in CPU visualizer.
- **Status**: Verified & Integrated successfully.

### Log #39: fix(cpu): prevent program counter overflow past RAM limits
- **Summary**: Checked bound offsets on PC increment.
- **Status**: Verified & Integrated successfully.

### Log #40: docs(cpu): detail opcode mnemonics LOAD, STORE, ADD, SUB
- **Summary**: Documented the supported 8-bit instruction set.
- **Status**: Verified & Integrated successfully.

### Log #41: test(cpu): verify ALU math outputs for positive integers
- **Summary**: Wrote assertion tests for ADD and SUB routines.
- **Status**: Verified & Integrated successfully.

### Log #42: chore(cpu): refine CPU clock speed tick frequency bounds
- **Summary**: Adjusted slider bounds to 1Hz - 10Hz.
- **Status**: Verified & Integrated successfully.

### Log #43: feat(cpu): print decoded instruction assembly structure
- **Summary**: Prints human readable opcode details to logs.
- **Status**: Verified & Integrated successfully.

### Log #44: style(cpu): color arithmetic operators on ALU representation
- **Summary**: ALU math signs now light up dynamically.
- **Status**: Verified & Integrated successfully.

### Log #45: refactor(cpu): unify register state updates under single handler
- **Summary**: Consolidated ACC, B, and IR register rendering.
- **Status**: Verified & Integrated successfully.

### Log #46: fix(cpu): reset ALU display values on program select change
- **Summary**: ALU clears output values during preset resets.
- **Status**: Verified & Integrated successfully.

### Log #47: docs(cpu): explain Branch-if-Zero assembly logic patterns
- **Summary**: Documented JZ instruction logic flow.
- **Status**: Verified & Integrated successfully.

### Log #48: style(cpu): use monospace font for memory addresses
- **Summary**: RAM rendering utilizes JetBrains Mono font.
- **Status**: Verified & Integrated successfully.

### Log #49: test(cpu): run infinite Fibonacci test suite parameters
- **Summary**: Checked loop recovery after register boundary limits.
- **Status**: Verified & Integrated successfully.

### Log #50: perf(cpu): optimize bus line pulse transition delays
- **Summary**: Speed up dashboard SVG line dashes.
- **Status**: Verified & Integrated successfully.

### Log #51: feat(cpu): add manual step execution button controllers
- **Summary**: User can click step button for diagnostic trace.
- **Status**: Verified & Integrated successfully.

### Log #52: fix(cpu): update Accumulator display on arithmetic writeback
- **Summary**: ACC updates values immediately after math executions.
- **Status**: Verified & Integrated successfully.

### Log #53: docs(cpu): layout fetch-decode-execute-writeback stages
- **Summary**: Added pipeline stages chart to code files.
- **Status**: Verified & Integrated successfully.

### Log #54: style(cpu): align RAM memory cells vertically in layout
- **Summary**: RAM cells aligned left in SVG frame.
- **Status**: Verified & Integrated successfully.

### Log #55: refactor(cpu): extract opcode mappings to enum structure
- **Summary**: Unified operational code words.
- **Status**: Verified & Integrated successfully.

### Log #56: fix(cpu): prevent executing raw data as instructions
- **Summary**: CPU halts if encountering non-object in code RAM cells.
- **Status**: Verified & Integrated successfully.

### Log #57: chore(cpu): adjust initial registers display offsets in SVG
- **Summary**: Corrected Y coordinate alignment for IR and PC.
- **Status**: Verified & Integrated successfully.

### Log #58: feat(cpu): log register trace updates in system feed
- **Summary**: Console lists changes on ACC and register B values.
- **Status**: Verified & Integrated successfully.

### Log #59: feat(pixel): add Space Invader retro icon preset loader
- **Summary**: Space Invader grid is now loaded on button click.
- **Status**: Verified & Integrated successfully.

### Log #60: feat(pixel): add 8-bit Web Palette color compressor
- **Summary**: Supported 256 colors quantization mapping.
- **Status**: Verified & Integrated successfully.

### Log #61: feat(pixel): add 4-bit Retro Palette color compressor
- **Summary**: Supported 16 colors quantization mapping.
- **Status**: Verified & Integrated successfully.

### Log #62: feat(pixel): add 1-bit Monochrome color compressor
- **Summary**: Supported black and white color thresholding.
- **Status**: Verified & Integrated successfully.

### Log #63: refactor(pixel): optimize subpixel magnifying calculations
- **Summary**: Optimized drawing speed for microscope canvas.
- **Status**: Verified & Integrated successfully.

### Log #64: style(pixel): add glass border design on microscope canvas
- **Summary**: Fitted microscope with glowing border frame.
- **Status**: Verified & Integrated successfully.

### Log #65: perf(pixel): redraw microscope only on pixel value changes
- **Summary**: Reduces paint rates on mouse movements.
- **Status**: Verified & Integrated successfully.

### Log #66: fix(pixel): handle drawing coordinate bounding offsets
- **Summary**: Checked boundaries on canvas grid hover.
- **Status**: Verified & Integrated successfully.

