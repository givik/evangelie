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
for chapter in range(1, 17):
    url = f"https://sasoeba.ge/ka/biblia/tanamedrove-kartul-enaze-orthodoxy/markozis-sakhareba/{chapter}"
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
        
        results = []
        container = soup.select_one('div.rt-Box > div.flex.flex-col.gap-rx-2')

        if container:
            for child in container.find_all(recursive=False):
                # Default content
                content = child.get_text(strip=True)
                
                # SPECIAL CASE: If it's a div, only look for the h3 inside it
                if child.name == "div":
                    h3_tag = child.find("h3")
                    if h3_tag:
                        content = h3_tag.get_text(strip=True).replace('\xa0', ' ')
                    # else: content remains child.get_text() as fallback

                results.append({
                    "tag": child.name,
                    "content": content,
                })

        # 3. INSERT INTO DATABASE (Logic stays the same)
        theme = ""
        for result in results:
            if result["tag"] == "div":
                theme = result["content"]  # Now contains only the H3 text
            
            if result["tag"] == "span":
                num, text = split_and_clean(result["content"])
                
                cur.execute(
                    "UPDATE მუხლები SET თემა = %s WHERE თავი = %s AND მუხლი = %s AND წიგნი = %s", 
                    (theme, headline_num, num, headline_text)
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