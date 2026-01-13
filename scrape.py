import requests
from bs4 import BeautifulSoup
import psycopg2
import re
import time

def split_and_clean(input_str):
    num_part = "".join(re.findall(r"\d+", input_str))
    text_part = re.sub(r"\d+\.\s*|\s*\d+\.?", "", input_str).strip()
    if input_str.endswith('.') and not text_part.endswith('.'):
        text_part += '.'
    return num_part, text_part

# 1. DATABASE CONNECTION (Keep it outside the loop)
conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password="",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

# 2. LOOP THROUGH PAGES (e.g., Chapter 1 to _)
for chapter in range(1, 22):
    url = f"https://sasoeba.ge/ka/biblia/mtskheturi-g-mtatsmindelis/sakharebai-iovanesi/{chapter}"
    print(f"Scraping chapter: {chapter}...")

    try:
        response = requests.get(url)
        response.raise_for_status() # Check if page exists
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract Book Title and Chapter Number
        header_el = soup.select_one('h1.rt-Heading.rt-r-size-5.rt-r-ta-center')
        if not header_el:
            continue
            
        headline = header_el.text.strip()
        headline_num, headline_text = split_and_clean(headline)

        # Extract Verses
        lines = [l.text.strip() for l in soup.select('div.rt-Box > div.flex.flex-col.gap-rx-2 > span.rt-Text')]
            
        # 3. INSERT INTO DATABASE
        for line in lines:
            num, text = split_and_clean(line)
            cur.execute(
                "UPDATE მუხლები SET ძველი_ტექსტი = %s WHERE თავი = %s AND მუხლი = %s AND წიგნი = %s", 
                (text, headline_num, num, 'იოანეს სახარება')
            )
        
        conn.commit() # Commit after every chapter
        print(f"Saved chapter {chapter} to database.")

    except Exception as e:
        print(f"Error on chapter {chapter}: {e}")

    # 4. WAIT (Polite Scraper Rule)
    time.sleep(1) # Pause for 1 second before the next request

# Cleanup
cur.close()
conn.close()
print("Scraping finished!")