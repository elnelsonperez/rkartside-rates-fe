# Interior Design Service Quoting System

This application provides a store-specific quoting system for interior design services. It allows store owners to generate quotes based on the number of spaces to decorate and the total sale amount.

## Features

- Fully Spanish user interface
- Support for customizable store logo
- Intuitive form for entering quotation data
- Rate calculation through an API
- Responsive design with Tailwind CSS
- Proper formatting of monetary values in DOP (Dominican Peso)

## Configuration

The application uses environment variables to facilitate customization per store:

1. `VITE_STORE_ID`: Unique store ID (used for rate calculation)
2. `VITE_LOGO_URL`: URL of the store logo to be displayed in the application
3. `VITE_API_URL`: Base URL of the API that provides the quotation service

### Local Configuration

To configure the application locally, create a `.env` file in the project root with the following variables:

```
VITE_STORE_ID=STORE_ID
VITE_LOGO_URL=LOGO_URL
VITE_API_URL=API_URL
```

## Installation and Usage

1. Make sure you have Node.js v22.14 or higher installed
2. Clone this repository
3. Install dependencies with `npm install`
4. Start the development server with `npm run dev`
5. To build the application for production, run `npm run build`
6. To run the tests, use `npm test`
7. To run the tests in watch mode, use `npm run test:watch`
8. To check TypeScript types without compiling, use `npm run typecheck`

## Deployment

This application is designed to be deployed as a static site on Netlify. Make sure to configure the environment variables in Netlify for each specific store instance.

## API Structure

The application expects an API endpoint (`/quote`) that accepts the following parameters:

```json
{
  "store_id": "STORE_ID",
  "number_of_spaces": 1,
  "sale_amount": 5000
}
```

The expected response should have the following format:

```json
{
  "rate": 1500
}
```

Where `rate` is the calculated cost of the interior design service.

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Vitest and React Testing Library for testing
