import app from './app';

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Document Export Job Tracker running on http://localhost:${port}`);
});
