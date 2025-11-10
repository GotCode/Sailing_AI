# Lagoon 440 Polar Diagram Guide

## What is a Polar Diagram?

A polar diagram is a graphical or tabular representation of a sailboat's performance characteristics. It shows the boat's theoretical speed at different combinations of:
- **True Wind Speed (TWS)**: The actual wind speed
- **True Wind Angle (TWA)**: The angle between the wind direction and the boat's heading (0° = head-to-wind, 90° = beam reach, 180° = running downwind)

## Lagoon 440 Default Polar Configuration

The app includes comprehensive polar data for the Lagoon 440 catamaran based on factory specifications and real-world performance data.

### Boat Specifications

- **Type**: Catamaran
- **Length**: 13.61m (44.7 ft)
- **Beam**: 7.7m (25.3 ft)
- **Displacement**: 12 tons
- **Main Sail Area**: 54 m²
- **Jib Area**: 49 m²
- **Genoa Area**: 58 m²
- **Spinnaker Area**: 110 m²
- **Asymmetrical Spinnaker**: 105 m²
- **Code Zero**: 95 m²

### Sail Configurations Included

#### 1. Main + Jib (Standard)
- **Wind Range**: 6-30 knots
- **Best For**: All-around sailing, upwind performance
- **Curves**: 8 wind speeds (6, 8, 10, 12, 14, 16, 20, 25 kts)
- **TWA Range**: 40-180°

#### 2. Main + Genoa
- **Wind Range**: 4-20 knots
- **Best For**: Light air performance, racing
- **Better upwind performance than standard jib**

#### 3. Main + Spinnaker
- **Wind Range**: 6-20 knots
- **Best For**: Downwind sailing, deep angles
- **TWA Range**: 90-180°
- **Maximum speeds in 10-18 knots of wind**

#### 4. Main + Asymmetrical
- **Wind Range**: 6-25 knots
- **Best For**: Fast reaching, broad reach
- **TWA Range**: 60-165°
- **Excellent speed on reaches**

#### 5. Code Zero
- **Wind Range**: 3-12 knots
- **Best For**: Light air reaching
- **TWA Range**: 40-120°
- **Maximum light air performance**

#### 6. Storm Jib + Reefed Main
- **Wind Range**: 25-50 knots
- **Best For**: Heavy weather
- **Reduced sail area for safety**

## Using the Polar Diagram

### In the Mobile App

1. **Navigate to Polar Tab**
   - Open the app
   - Tap on "Polar" in the bottom navigation

2. **Enter Current Conditions**
   - Wind Speed: Current true wind speed in knots
   - TWA: Your current true wind angle
   - Boat Speed: Your actual speed (optional)

3. **View Performance**
   - **Target Speed**: What the polar says you should be doing
   - **Actual Speed**: What you're actually doing
   - **Performance %**: (Actual / Target) × 100

### Interpreting the Data

#### VMG (Velocity Made Good)
- **Upwind VMG**: Best speed directly towards the wind
  - Optimal angles: 45-52° TWA
  - Maximum progress to windward

- **Downwind VMG**: Best speed directly away from the wind
  - Optimal angles: 135-150° TWA
  - Maximum progress downwind

#### Performance Targets
- **90-110%**: Excellent performance
- **80-90%**: Good performance
- **70-80%**: Fair performance
- **<70%**: Poor performance - check sail trim, boat speed, or conditions

### Finding Optimal Sailing Angles

For a given wind speed, the polar shows you:

1. **Best Upwind Angle**
   - Usually 45-52° TWA
   - Balance between pointing and speed

2. **Best Reaching Speed**
   - Usually 90-120° TWA
   - Maximum boat speed

3. **Best Downwind Angle**
   - Usually 135-150° TWA
   - May be faster to tack downwind (jibe angles)

## API Integration

### Fetching Polar Data

```typescript
// Get default Lagoon 440 polar
const response = await fetch('https://your-api.com/api/polars/default/lagoon440');
const { polar } = await response.json();
```

### Custom Polars

```typescript
// Create custom polar
const customPolar = {
  name: 'My Lagoon 440',
  boatType: 'Catamaran',
  boatModel: 'Lagoon 440',
  // ... other data
};

const response = await fetch('https://your-api.com/api/polars', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(customPolar),
});
```

## Customizing Your Polar

### Why Customize?

Every boat is different based on:
- Hull condition (clean vs. fouled)
- Weight and loading
- Sail condition and cut
- Crew skill
- Sea state

### How to Customize

1. **Record Actual Performance**
   - Log your speeds at different TWA and TWS
   - Compare with polar targets
   - Note conditions (sea state, current, etc.)

2. **Adjust Polar Values**
   - Reduce speeds by 5-10% for fouled hull
   - Reduce speeds by 10-15% for heavy loading
   - Increase speeds by 5-10% for expert crew

3. **Save Custom Polar**
   - Create a new polar diagram
   - Name it clearly (e.g., "My Lagoon 440 - Fully Loaded")
   - Use for trip planning

## Polar Data Format

### JSON Structure

```json
{
  "id": "lagoon-440-default",
  "name": "Lagoon 440 - Factory Standard",
  "boatType": "Catamaran",
  "boatModel": "Lagoon 440",
  "length": 13.61,
  "beam": 7.7,
  "displacement": 12.0,
  "sailArea": {
    "main": 54,
    "jib": 49
  },
  "polarData": [
    {
      "sailConfig": "Main + Jib",
      "windRange": { "min": 6, "max": 30 },
      "curves": [
        {
          "tws": 10,
          "points": [
            { "twa": 45, "speed": 6.3, "vmg": 4.5 },
            { "twa": 60, "speed": 7.2, "vmg": 3.6 }
          ]
        }
      ]
    }
  ]
}
```

### CSV Export Format

```csv
Polar Diagram: Lagoon 440 - Factory Standard
Boat: Catamaran - Lagoon 440
Sail Configuration: Main + Jib

TWA,6,8,10,12,14,16,20,25
40,4.2,5.1,5.8,6.3,6.7,7.0,7.4,7.7
45,4.5,5.5,6.3,6.9,7.4,7.8,8.3,8.7
52,5.1,6.0,6.7,7.3,7.8,8.2,8.7,9.1
...
```

## Advanced Features

### Performance Analysis

The app can:
- Compare your actual performance vs. polar targets
- Track performance over time
- Identify which conditions you sail best in
- Suggest optimal sail configurations

### Route Optimization

Using the polar data, the app can:
- Calculate optimal VMG angles for your course
- Recommend when to tack/jibe
- Estimate passage times
- Suggest alternative routes based on wind forecasts

### Weather Routing Integration

Combined with weather forecasts:
- Predict your speed along a route
- Calculate ETAs for each waypoint
- Recommend departure times
- Suggest course changes for better performance

## Tips for Best Results

1. **Keep Hull Clean**: Clean hull = polar speeds
2. **Trim Sails Properly**: Proper trim is essential for target speeds
3. **Use Correct Sail**: Match sail configuration to conditions
4. **Log Performance**: Track actual vs. polar to learn your boat
5. **Account for Conditions**: Adjust expectations for sea state and current

## Troubleshooting

### Speed Much Lower Than Polar

Check:
- Hull cleanliness
- Sail trim
- Weight distribution
- Sea state (waves slow you down)
- Current (adverse current affects speed)

### Speed Higher Than Polar

Possible causes:
- Favorable current
- Better sails than standard
- Surfing conditions
- Measurement error

## Technical Reference

### Calculations

**VMG Calculation**:
```
VMG = Boat Speed × cos(TWA)
```

**Speed Interpolation**:
The app interpolates between polar points to give smooth speed estimates at any TWA/TWS combination.

**Performance Percentage**:
```
Performance = (Actual Speed / Polar Speed) × 100
```

## Support & Resources

- **In-App Help**: Tap the info icon on the Polar screen
- **API Documentation**: See DEPLOYMENT.md for API details
- **Community Polars**: Browse and clone public polar diagrams
- **Custom Polar Support**: Contact support for help creating custom polars

## Example Use Cases

### 1. Planning a Passage
- Check polar for expected speeds at forecast wind speeds
- Calculate ETA for each leg
- Choose best departure time

### 2. Racing
- Find optimal VMG angles
- Compare different sail configurations
- Maximize performance percentage

### 3. Cruising
- Choose comfort mode in the app
- Select conservative sail configurations
- Plan for daytime arrivals using speed estimates

### 4. Training
- Track your improvement over time
- Learn your boat's sweet spots
- Practice hitting target speeds

## Conclusion

The polar diagram is your guide to sailing your Lagoon 440 at its best. Use it to:
- ✅ Choose the right sails
- ✅ Sail at optimal angles
- ✅ Track your performance
- ✅ Plan passages accurately
- ✅ Improve your sailing skills

Remember: Polar diagrams show theoretical maximum performance in ideal conditions. Real-world performance will vary, but polars give you targets to aim for!
