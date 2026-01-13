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
for chapter in range(1, 25):
    url = f"https://sasoeba.ge/ka/biblia/tanamedrove-kartul-enaze-orthodoxy/lukas-sakhareba/{chapter}"
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
                
                # SPECIAL CASE: If it's a div, only look for the a inside it
                if child.name == "div":
                    a_tag = child.find("a")
                    if a_tag:
                        theme = a_tag.get_text(strip=True).replace('\xa0', ' ')
                        # print()
                        # print(theme)
                        a_url = f"https://sasoeba.ge{a_tag.get('href')}"
                        
                        try:
                            time.sleep(1) # Pause for 1 second before the request
                            response = requests.get(a_url)
                            response.raise_for_status() # Check if page exists
                            soup = BeautifulSoup(response.text, 'html.parser')
                            
                            # The selector uses dots for classes and '>' for immediate children
                            selector = 'div.mb-rx-4 > a > h3.rt-Heading.rt-r-size-3.inline'

                            # This creates an array of strings
                            h3_texts = [h3.get_text(strip=True) for h3 in soup.select(selector)]

                            def parse_bible_references(refs):
                                parsed_list = []
                                
                                pattern = r"^(.*)\s(\d+):(\d+)(?:-(\d+))?$"
                                
                                for ref in refs:
                                    match = re.match(pattern, ref)
                                    if match:
                                        book, chapter, v_from, v_to = match.groups()
                                        parsed_list.append({
                                            "book": book.strip(),
                                            "chapter": chapter,
                                            "from": v_from,
                                            "to": v_to if v_to else "" # Use empty string if no 'to' verse exists
                                        })
                                        
                                return parsed_list
                            
                            references = parse_bible_references(h3_texts)
                            
                            for item in references:
                                
                                query = f"UPDATE მუხლები SET თემა = '{theme}' WHERE წიგნი = '{item['book']}' AND თავი = '{item['chapter']}' AND მუხლი >= '{item['from']}' AND მუხლი <= '{item['to']}'"

                                if item['to'] == "":
                                    query = f"UPDATE მუხლები SET თემა = '{theme}' WHERE წიგნი = '{item['book']}' AND თავი = '{item['chapter']}' AND მუხლი = '{item['from']}'"
                                
                                print("---")
                                print(item)
                                print(query)
                                
                                cur.execute(query)
                                conn.commit()

                        except Exception as e:
                            print(f"Error on page {a_url}: {e}")
                            
    except Exception as e:
        print(f"Error on chapter {chapter}: {e}")

    # 4. WAIT (Polite Scraper Rule)
    time.sleep(1)

# Cleanup
cur.close()
conn.close()
print("Scraping finished!")