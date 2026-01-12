import styles from './page.module.css';
import { getData, getOptions } from './actions';
import Form from './form';

export default async function Home() {
  const definitions = (await getData())[0];
  const defaults = (await getData())[1];

  // options the full list of books/chaps/verses
  const options = await getOptions();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.data}>
          {definitions.map((def) => (
            <div key={def.id} className={styles.record}>
              <div className={styles.author}>{def.ავტორი}</div>
              <span className={styles.book}>{defaults.წიგნი}</span>
              <span className={styles.chapter}>თავი {defaults.თავი}</span>
              <span className={styles.line}>მუხლი {defaults.მუხლი}</span>
              <div className={styles.text}>{def.ტექსტი}</div>
            </div>
          ))}
        </div>
        <Form options={options} defaults={defaults} />
      </main>
    </div>
  );
}
