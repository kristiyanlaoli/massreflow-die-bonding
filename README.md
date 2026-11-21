# Flip Chip Mass Reflow Simulator v1.0

Interactive 3D teaching app based on the Paste v1.6 / Film v1.0 interface. Independent Next.js project for Vercel. The default language is English; local SVG flag buttons switch to Indonesian and Traditional Chinese (Taiwan). No database or CSV export.

## Run locally / deploy

```bash
npm install
npm run dev
# production check
npm run build
```

Extract this archive into a new GitHub repository, then import it in Vercel (Next.js framework preset, default build settings). No API keys required. The project is source code, not a deployed website.

## Process

The project reference images `Flip Chip (Mass Reflow) Process Flow.jpg`, `Flip Chip Mechanism Process.jpg` and `Under Fill Process - Flip Chip (Mass Reflow).png` show flux coating, chip placement, reflow, cleaning, underfill and cure. We add pickup with assisted eject and 180° flip, optical alignment and inspection. Starting material is an already bumped and diced wafer coupon. The oven shows three representative packages experiencing the same accelerated thermal cycle, not local thermocompression. The cleanable-flux example is distinct from no-clean processes. Encapsulation and final assembly are outside the simulation.

## Controls

Adjust die size/thickness, bump diameter and pitch, relative flux amount, placement force and offsets. The second settings tab includes peak temperature, requested time above liquidus, cleaning effectiveness, relative underfill amount, viscosity, cure temperature/time. Cross-section is available after reflow. PASS/FAIL and detailed failure explanations are displayed directly. The flags use vector artwork, not emoji. The viewport occupies the available desktop height; mobile uses a single-column layout.

## Validation and limitations

See ENGINEERING_NOTES.md. Geometry, formulas, defect thresholds and process timing are illustrative. No real product acceptance or calibrated CFD/thermal / metallurgical prediction is implied. The sampled 5×5 array represents a much larger bump array and is deliberately magnified; die, bump/pad and underfill dimensions are not on a common physical scale. Actual solder alloy, pad metallurgy, flux, X-ray inspection and underfill recipes require supplier and process validation.

## v1.1 Mobile layout update

- Hide **Process Scenarios** on phone and narrow tablet screens (viewport width ≤999 px), matching the Paste Type simulator.
- Keep scenario buttons available on desktop (viewport width ≥1000 px).
- 3D workflow, process parameters, and language support are unchanged.
