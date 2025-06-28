import sys
import json
import csv
import requests
from bs4 import BeautifulSoup

#Leer clases con tag desde stdin.
clases_recibidas = json.load(sys.stdin)

#Convertir strings a tuplas (tag, set de clases)
sets_de_clases = []
for c in clases_recibidas:
    partes = c.split()
    tag = partes[0].lower()
    clases = set(partes[1:])
    sets_de_clases.append((tag, clases))

base_url = 'https://es.trustpilot.com/review/www.crealsa.es'
headers = {'User-Agent': 'Mozilla/5.0'}

page = 1
resultados = []

while True:
    url = base_url if page == 1 else f"{base_url}?page={page}"
    print(f"Scrapeando: {url}")
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        print(f"Error al obtener {url} (código {response.status_code})")
        break

    soup = BeautifulSoup(response.text, 'html.parser')

    #Buscar contenedor principal
    contenedor = soup.find('div', class_='styles_mainContent__d9oos')
    if not contenedor:
        print(f"No se encontró el contenedor principal en la página {page}. Fin del scraping.")
        break

    #Buscar grupos
    grupos = contenedor.find_all("div", class_="styles_cardWrapper__g8amG styles_show__Z8n7u")
    if not grupos:
        print(f"No se encontraron grupos en la página {page}. Fin del scraping.")
        break

    for grupo in grupos:
        fila = {}
        for tag_ref, clases_ref in sets_de_clases:
            #Buscar elemento exacto con el mismo tag y conjunto de clases
            for elemento in grupo.find_all(tag_ref):
                clases_elemento = set(elemento.get("class", []))
                if clases_elemento == clases_ref:
                    texto = elemento.get_text(strip=True) if elemento.get_text(strip=True) else ""
                    alt = elemento.get("alt", "") if elemento.has_attr("alt") else ""
                    contenido = alt if alt else texto
                    clave = f"{tag_ref}_{'_'.join(sorted(clases_ref))}"
                    fila[clave] = contenido
                    break  #Solo uno por grupo
        if fila:
            resultados.append(fila)

    page += 1

#Obtener todas las claves (columnas)
todas_las_claves = set()
for fila in resultados:
    todas_las_claves.update(fila.keys())
todas_las_claves = sorted(todas_las_claves)

#Guardar en CSV
csv_path = "../resultados.csv"
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=todas_las_claves)
    writer.writeheader()
    for fila in resultados:
        writer.writerow(fila)

print(f"Scraping completo. Guardados {len(resultados)} grupos en {csv_path}")
