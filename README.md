# Next.js Internet Speed Test App

This project is a Next.js application that allows users to test their internet speed, including upload and download speeds, as well as ping latency. The application features a customizable UI that displays the results in various formats, including meters and other visual representations.

## Features

- Perform internet speed tests using Cloudflare's edge network.
- Display upload speed, download speed, and ping latency.
- Customizable display options for metrics and formats.
- User-friendly interface with interactive controls.
- Responsive design for various devices.

## Technologies Used

- Next.js: A React framework for server-side rendering and static site generation.
- TypeScript: A typed superset of JavaScript that compiles to plain JavaScript.
- CSS: For styling the application.
- @cloudflare/speedtest: For performing speed tests against Cloudflare's network.
- network-speed: For checking upload and download speeds.
- ng-speed-test: For additional speed testing functionalities.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- pnpm (version 6 or higher)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd internet-speed
   ```

3. Install the dependencies using pnpm:

   ```
   pnpm install
   ```

### Running the Application

To start the development server, run:

```
pnpm dev
```

Open your browser and navigate to `http://localhost:3000` to view the application.

### Customization

Users can customize which metrics to display and in what format by modifying the configuration in `src/config/displayOptions.ts`. The UI components are designed to be flexible, allowing for easy adjustments to the layout and presentation of speed test results.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.