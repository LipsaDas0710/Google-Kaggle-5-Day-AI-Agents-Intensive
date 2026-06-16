import xml.etree.ElementTree as ET
import urllib.request
import urllib.error
import time
from flask import Flask, render_template, jsonify
from bs4 import BeautifulSoup

app = Flask(__name__)

# Simple in-memory cache configuration (cache for 5 minutes)
CACHE_DURATION_SECS = 300  
feed_cache = {
    "data": None,
    "last_fetched": 0
}

def parse_entry_updates(date, entry_id, link, content_html):
    """
    Parses the HTML content of a feed entry and splits it into individual updates
    grouped by update type (e.g. Feature, Issue, Change, Deprecation).
    """
    if not content_html:
        return []
    
    soup = BeautifulSoup(content_html, 'html.parser')
    updates = []
    
    # Check if there are h3 tags which represent update types.
    h3_tags = soup.find_all('h3')
    
    if not h3_tags:
        # Fallback if no structured <h3> is present
        text_content = soup.get_text(separator=' ').strip()
        updates.append({
            "id": f"{entry_id}_0",
            "date": date,
            "type": "Update",
            "content_html": content_html,
            "content_text": text_content,
            "link": link
        })
        return updates
    
    current_type = None
    current_elements = []
    update_index = 0
    
    for child in soup.children:
        if child.name == 'h3':
            # Save the previous update
            if current_type and current_elements:
                sub_html = "".join(str(el) for el in current_elements)
                sub_text = BeautifulSoup(sub_html, 'html.parser').get_text(separator=' ').strip()
                # Remove extra spaces/newlines
                sub_text = " ".join(sub_text.split())
                
                updates.append({
                    "id": f"{entry_id}_{update_index}",
                    "date": date,
                    "type": current_type,
                    "content_html": sub_html,
                    "content_text": sub_text,
                    "link": link
                })
                update_index += 1
                current_elements = []
            current_type = child.get_text().strip()
        else:
            if current_type:
                current_elements.append(child)
                
    # Save the final update
    if current_type and current_elements:
        sub_html = "".join(str(el) for el in current_elements)
        sub_text = BeautifulSoup(sub_html, 'html.parser').get_text(separator=' ').strip()
        sub_text = " ".join(sub_text.split())
        updates.append({
            "id": f"{entry_id}_{update_index}",
            "date": date,
            "type": current_type,
            "content_html": sub_html,
            "content_text": sub_text,
            "link": link
        })
        
    return updates

def fetch_feed_data(force=False):
    """
    Fetches the BigQuery release notes atom feed.
    Uses cached data if available and fresh.
    """
    now = time.time()
    if not force and feed_cache["data"] and (now - feed_cache["last_fetched"] < CACHE_DURATION_SECS):
        return feed_cache["data"], True

    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFeedReader/1.0'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
    except urllib.error.URLError as e:
        # If fetch fails, return cache if available
        if feed_cache["data"]:
            return feed_cache["data"], True
        raise Exception(f"Failed to fetch feed: {str(e)}")
        
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        if feed_cache["data"]:
            return feed_cache["data"], True
        raise Exception(f"Failed to parse XML feed: {str(e)}")
        
    # Atom namespace
    ns = {'ns': 'http://www.w3.org/2005/Atom'}
    
    all_updates = []
    
    for entry in root.findall('ns:entry', ns):
        title = entry.find('ns:title', ns)
        date_str = title.text.strip() if title is not None else "Unknown Date"
        
        entry_id_elem = entry.find('ns:id', ns)
        entry_id = entry_id_elem.text.strip() if entry_id_elem is not None else str(hash(date_str))
        # Clean ID for HTML usage
        entry_id = entry_id.split("#")[-1] if "#" in entry_id else entry_id
        entry_id = re_sub(r'[^a-zA-Z0-9_-]', '_', entry_id)
        
        link_elem = entry.find('ns:link', ns)
        link = link_elem.attrib.get('href') if link_elem is not None else ""
        
        content_elem = entry.find('ns:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        entry_updates = parse_entry_updates(date_str, entry_id, link, content_html)
        all_updates.extend(entry_updates)
        
    # Cache results
    feed_cache["data"] = all_updates
    feed_cache["last_fetched"] = now
    return all_updates, False

def re_sub(pattern, replacement, text):
    import re
    return re.sub(pattern, replacement, text)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        updates, from_cache = fetch_feed_data(force=False)
        return jsonify({
            "status": "success",
            "from_cache": from_cache,
            "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(feed_cache["last_fetched"])),
            "count": len(updates),
            "updates": updates
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/releases/refresh')
def refresh_releases():
    try:
        updates, from_cache = fetch_feed_data(force=True)
        return jsonify({
            "status": "success",
            "from_cache": from_cache,
            "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(feed_cache["last_fetched"])),
            "count": len(updates),
            "updates": updates
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
