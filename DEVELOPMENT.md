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

