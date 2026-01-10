import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.data}>
          <div className={styles.record}>
            <div className={styles.author}>ავტორის სახელი გვარი და წოდება</div>
            <div className={styles.text}>
              განმარტების ტექსტი განმარტების ტექსტი განმარტების ტექსტი...
            </div>
            <span className={styles.book}>მათეს სახარება</span>
            <span className={styles.chapter}>თავი 1</span>
            <span className={styles.line}>მუხლი 1</span>
          </div>
        </div>
        <div className={styles.form}>
          <div className={styles.dropdownContainer}>
            <select name="book" className={styles.dropdown}>
              <option value="option1">მათეს სახარება</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
            <select name="chapter" className={styles.dropdown}>
              <option value="option1">თავი 1</option>
              <option value="option2">თავი 2</option>
              <option value="option3">თავი 3</option>
            </select>
            <select name="line" className={styles.dropdown}>
              <option value="option1">მუხლი 1</option>
              <option value="option2">მუხლი 2</option>
              <option value="option3">მუხლი 3</option>
            </select>
          </div>
          <input name="author" className={styles.input} type="text" placeholder="ავტორი..." />
          <textarea
            name="description"
            className={styles.textarea}
            placeholder="შეიყვანეთ ტექსტი..."
          />
          <button className={styles.button}>დამახსოვრება</button>
        </div>
      </main>
    </div>
  );
}
