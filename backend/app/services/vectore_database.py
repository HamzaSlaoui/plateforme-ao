import logging
from core.config import Config
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, FilterSelector, Filter, PayloadSchemaType
from sentence_transformers import SentenceTransformer
import logging

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


qdrant_collection = "document_chunks"

# Client
qdrant_client = QdrantClient(
    url=Config.QDRANT_URL,
    api_key=Config.QDRANT_API_KEY,
)

# Embedding
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str):
    return embedding_model.encode(
        f"Represent this sentence for retrieval: {text}",
        normalize_embeddings=True
    ).tolist()

def create_collection():
    try:
        qdrant_client.create_collection(
            collection_name=qdrant_collection,
            vectors_config=VectorParams(size=Config.VECTOR_SIZE, distance=Distance.COSINE),
        )
        logger.info(f"Collection '{qdrant_collection}' créée avec succès.")
    except Exception as e:
        logger.error(f"Erreur création collection: {str(e)}")

def delete_collection():
    try:
        qdrant_client.delete_collection(qdrant_collection)
        logger.info(f"Collection '{qdrant_collection}' supprimée avec succès.")
    except Exception as e:
        logger.error(f"Erreur suppression collection: {str(e)}")

def clear_collection():
    try:
        qdrant_client.delete(
            collection_name=qdrant_collection,
            points_selector=FilterSelector(filter=Filter(must=[]))
        )
        logger.info(f"Toutes les entrées de la collection '{qdrant_collection}' ont été supprimées.")
    except Exception as e:
        logger.error(f"Erreur lors de la suppression des points: {str(e)}")

def ensure_indexes():
    try:
        qdrant_client.create_payload_index(
            collection_name=qdrant_collection,
            field_name="tender_folder_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        logger.info("Index 'tender_folder_id' créé avec succès.")
    except Exception as e:
        logger.warning(f"Index déjà existant ou erreur : {str(e)}")

# CLI pour exécuter des commandes
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "create":
            create_collection()
        elif cmd == "delete":
            delete_collection()
        elif cmd == "clear":
            clear_collection()
        elif cmd == "ensure-index":
            ensure_indexes()
        else:
            print("Utilisation : python vector_database.py [create|delete|clear|ensure-index]")
    else:
        print("Utilisation : python vector_database.py [create|delete|clear|ensure-index]")