from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from sentence_transformers import SentenceTransformer
import logging
from core.config import Config

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


qdrant_collection = "document_chunks"

# Client
qdrant_client = QdrantClient(
    url=Config.QDRANT_URL,
    api_key=Config.QDRANT_API_KEY,
)


embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str):
    return embedding_model.encode(text).tolist()

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


# Utile pour executer cette commande docker-compose exec backend python vector_database.py (create | delete)
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "create":
            create_collection()
        elif sys.argv[1] == "delete":
            delete_collection()
        else:
            print("Utilisation : python vector_database.py [create|delete]")
    else:
        print("Utilisation : python vector_database.py [create|delete]")

