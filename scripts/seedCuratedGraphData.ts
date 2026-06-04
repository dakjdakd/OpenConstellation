import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GraphData, GraphEdge, GraphNode, RelationType } from '../src/types.ts';

const sources = {
  openai: 'https://openai.com/about/',
  chatgpt: 'https://openai.com/chatgpt/',
  gpt4: 'https://openai.com/research/gpt-4',
  gpt4o: 'https://openai.com/index/hello-gpt-4o/',
  sora: 'https://openai.com/sora/',
  anthropic: 'https://www.anthropic.com/company',
  claude: 'https://www.anthropic.com/claude',
  claude3: 'https://www.anthropic.com/news/claude-3-family',
  claude35: 'https://www.anthropic.com/news/claude-3-5-sonnet',
  google: 'https://about.google/',
  deepmind: 'https://deepmind.google/about/',
  gemini: 'https://deepmind.google/technologies/gemini/',
  gemini15: 'https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/',
  transformerPaper: 'https://arxiv.org/abs/1706.03762',
  attentionPaper: 'https://arxiv.org/abs/1706.03762',
  meta: 'https://ai.meta.com/',
  llama: 'https://ai.meta.com/llama/',
  llama3: 'https://ai.meta.com/blog/meta-llama-3/',
  pytorch: 'https://pytorch.org/',
  huggingface: 'https://huggingface.co/',
  transformers: 'https://github.com/huggingface/transformers',
  diffusion: 'https://arxiv.org/abs/2006.11239',
  stableDiffusion: 'https://stability.ai/stable-image',
  stability: 'https://stability.ai/',
  midjourney: 'https://www.midjourney.com/home',
  mistral: 'https://mistral.ai/company/',
  mixtral: 'https://mistral.ai/news/mixtral-of-experts/',
  mistralLarge: 'https://mistral.ai/news/mistral-large/',
  cohere: 'https://cohere.com/about',
  commandR: 'https://cohere.com/blog/command-r',
  xai: 'https://x.ai/company',
  grok: 'https://x.ai/grok',
  perplexity: 'https://www.perplexity.ai/',
  notion: 'https://www.notion.so/product/ai',
  cursor: 'https://www.cursor.com/',
  github: 'https://github.com/about',
  copilot: 'https://github.com/features/copilot',
  microsoft: 'https://www.microsoft.com/ai',
  azureOpenai: 'https://azure.microsoft.com/products/ai-services/openai-service',
  nvidia: 'https://www.nvidia.com/en-us/ai-data-science/',
  cuda: 'https://developer.nvidia.com/cuda-zone',
  tensorrt: 'https://developer.nvidia.com/tensorrt',
  langchain: 'https://www.langchain.com/',
  langchainGithub: 'https://github.com/langchain-ai/langchain',
  llamaIndex: 'https://www.llamaindex.ai/',
  llamaIndexGithub: 'https://github.com/run-llama/llama_index',
  vectorDb: 'https://www.pinecone.io/learn/vector-database/',
  pinecone: 'https://www.pinecone.io/',
  weaviate: 'https://weaviate.io/',
  qdrant: 'https://qdrant.tech/',
  kubernetes: 'https://kubernetes.io/',
  ray: 'https://www.ray.io/',
  vllm: 'https://github.com/vllm-project/vllm',
  ollama: 'https://ollama.com/',
  gradio: 'https://www.gradio.app/',
  streamlit: 'https://streamlit.io/',
  arxiv: 'https://arxiv.org/',
  openrouter: 'https://openrouter.ai/',
  together: 'https://www.together.ai/',
  scale: 'https://scale.com/',
};

const nodes: GraphNode[] = [
  company('openai', 'OpenAI', 'AI research and deployment company', 'OpenAI develops frontier models and products including ChatGPT, GPT-4, GPT-4o, and Sora.', '2015-12-11', ['Sam Altman', 'Ilya Sutskever', 'Greg Brockman', 'Wojciech Zaremba', 'John Schulman', 'Elon Musk'], ['LLM', 'Frontier Models', 'AGI'], sources.openai, ['USA'], 10, [
    event('2015-12-11', 'OpenAI founded', 'OpenAI was founded as an AI research organization in San Francisco.'),
    event('2022-11-30', 'ChatGPT launched', 'ChatGPT introduced a mass-market conversational interface for large language models.'),
    event('2024-05-13', 'GPT-4o announced', 'OpenAI introduced GPT-4o as an omni model for text, audio, and vision interaction.'),
  ]),
  product('chatgpt', 'ChatGPT', 'Conversational AI product', 'ChatGPT is OpenAI’s assistant product for writing, coding, analysis, and multimodal interaction.', '2022-11-30', ['Chatbot', 'Productivity', 'LLM'], sources.chatgpt, 10),
  model('gpt4', 'GPT-4', 'Multimodal foundation model', 'GPT-4 is a large multimodal model released by OpenAI and used across ChatGPT and API products.', ['LLM', 'Multimodal', 'Foundation Model'], sources.gpt4, 10),
  model('gpt4o', 'GPT-4o', 'Omni multimodal model', 'GPT-4o is an OpenAI model designed for real-time multimodal text, vision, and audio interaction.', ['Multimodal', 'Realtime', 'Foundation Model'], sources.gpt4o, 10),
  product('sora', 'Sora', 'Text-to-video generation system', 'Sora is OpenAI’s video generation system for creating realistic and imaginative scenes from prompts.', undefined, ['Video Generation', 'Diffusion', 'Multimodal'], sources.sora, 9),
  company('anthropic', 'Anthropic', 'AI safety and frontier model company', 'Anthropic develops Claude models and emphasizes AI safety, interpretability, and constitutional AI.', '2021-01-01', ['Dario Amodei', 'Daniela Amodei'], ['LLM', 'Safety', 'Frontier Models'], sources.anthropic, ['USA'], 9, [
    event('2021-01-01', 'Anthropic founded', 'Anthropic was founded by former OpenAI employees with a focus on AI safety.'),
    event('2023-03-14', 'Claude released', 'Anthropic released Claude as an AI assistant product family.'),
    event('2024-03-04', 'Claude 3 family', 'Anthropic introduced the Claude 3 model family.'),
  ]),
  product('claude', 'Claude', 'AI assistant by Anthropic', 'Claude is Anthropic’s assistant interface for writing, analysis, coding, and enterprise workflows.', undefined, ['Chatbot', 'Productivity', 'Safety'], sources.claude, 9),
  model('claude3', 'Claude 3', 'Anthropic model family', 'Claude 3 is Anthropic’s model family including Haiku, Sonnet, and Opus variants.', ['LLM', 'Safety', 'Foundation Model'], sources.claude3, 9),
  model('claude35-sonnet', 'Claude 3.5 Sonnet', 'High-performance Claude model', 'Claude 3.5 Sonnet is an Anthropic model focused on stronger reasoning, coding, and agentic workflows.', ['LLM', 'Coding', 'Reasoning'], sources.claude35, 9),
  company('google', 'Google', 'Global technology company', 'Google is a major AI, cloud, search, and infrastructure company behind Transformer research and Gemini products.', '1998-09-04', ['Larry Page', 'Sergey Brin'], ['Search', 'Cloud', 'AI'], sources.google, ['USA'], 10),
  company('google-deepmind', 'Google DeepMind', 'AI research lab', 'Google DeepMind is Google’s AI research organization developing Gemini and foundational AI systems.', undefined, [], ['Research', 'Frontier Models', 'AI Safety'], sources.deepmind, ['UK', 'USA'], 10),
  model('gemini', 'Gemini', 'Google multimodal model family', 'Gemini is Google DeepMind’s multimodal AI model family powering Google AI products.', ['Multimodal', 'LLM', 'Foundation Model'], sources.gemini, 9),
  model('gemini-1-5', 'Gemini 1.5', 'Long-context Gemini model', 'Gemini 1.5 introduced long-context capabilities and improved multimodal reasoning in the Gemini family.', ['Long Context', 'Multimodal', 'LLM'], sources.gemini15, 9),
  research('attention-is-all-you-need', 'Attention Is All You Need', 'Transformer research paper', 'The 2017 paper introduced the Transformer architecture that underpins modern large language models.', '2017-06-12', ['Paper', 'NLP', 'Transformer'], sources.attentionPaper, 10),
  technology('transformer', 'Transformer', 'Attention-based neural network architecture', 'The Transformer architecture uses self-attention and became the foundation for modern LLMs.', '2017-06-12', ['Architecture', 'Deep Learning', 'Attention'], sources.transformerPaper, 10),
  company('meta', 'Meta', 'Social technology and AI company', 'Meta develops open AI models and infrastructure including Llama and PyTorch.', undefined, [], ['Open Source', 'AI', 'Social'], sources.meta, ['USA'], 10),
  openSource('llama', 'Llama', 'Open foundation model family', 'Llama is Meta’s family of open foundation models for research and production use.', ['Open Weights', 'LLM', 'Foundation Model'], sources.llama, 10),
  openSource('llama3', 'Llama 3', 'Meta open model generation', 'Llama 3 is Meta’s open model generation with strong multilingual and reasoning capabilities.', ['Open Weights', 'LLM'], sources.llama3, 9),
  openSource('pytorch', 'PyTorch', 'Deep learning framework', 'PyTorch is an open source machine learning framework widely used for AI research and production.', ['Framework', 'Deep Learning', 'Training'], sources.pytorch, 10),
  company('huggingface', 'Hugging Face', 'AI community and model hub', 'Hugging Face hosts models, datasets, Spaces, and open source tools for machine learning workflows.', '2016-01-01', [], ['Model Hub', 'Open Source', 'Community'], sources.huggingface, ['USA', 'France'], 10),
  openSource('transformers-library', 'Transformers Library', 'Hugging Face model library', 'The Transformers library provides APIs and pretrained model integrations for NLP, vision, audio, and multimodal models.', ['Library', 'Model Hub', 'Open Source'], sources.transformers, 10, 'https://github.com/huggingface/transformers'),
  technology('diffusion-models', 'Diffusion Models', 'Generative modeling approach', 'Diffusion models generate data by learning to reverse a gradual noise process and are central to image and video generation.', '2020-06-19', ['Generative AI', 'Image Generation', 'Math'], sources.diffusion, 9),
  company('stability-ai', 'Stability AI', 'Generative AI company', 'Stability AI develops open generative media models and products including Stable Diffusion-related systems.', undefined, [], ['Image Generation', 'Open Models', 'Generative AI'], sources.stability, ['UK'], 8),
  model('stable-diffusion', 'Stable Diffusion', 'Text-to-image model family', 'Stable Diffusion is a widely used latent diffusion model family for image generation.', ['Image Generation', 'Diffusion', 'Open Weights'], sources.stableDiffusion, 9),
  company('midjourney', 'Midjourney', 'Independent AI image generation lab', 'Midjourney builds a popular image generation service focused on creative visual synthesis.', undefined, [], ['Image Generation', 'Creative Tools'], sources.midjourney, ['USA'], 9),
  company('mistral-ai', 'Mistral AI', 'European frontier AI company', 'Mistral AI develops open and commercial language models for developers and enterprises.', '2023-04-01', [], ['LLM', 'Open Models', 'Europe'], sources.mistral, ['France'], 9),
  model('mixtral', 'Mixtral', 'Sparse mixture-of-experts model', 'Mixtral is Mistral AI’s sparse mixture-of-experts model line focused on efficient open model performance.', ['MoE', 'Open Weights', 'LLM'], sources.mixtral, 8),
  model('mistral-large', 'Mistral Large', 'Mistral frontier model', 'Mistral Large is a commercial frontier model from Mistral AI for complex multilingual reasoning tasks.', ['LLM', 'Reasoning', 'Multilingual'], sources.mistralLarge, 8),
  company('cohere', 'Cohere', 'Enterprise AI platform company', 'Cohere builds language models and retrieval products for enterprise AI applications.', undefined, [], ['Enterprise AI', 'RAG', 'LLM'], sources.cohere, ['Canada'], 8),
  model('command-r', 'Command R', 'Retrieval-augmented model family', 'Command R is Cohere’s model family optimized for retrieval-augmented generation and enterprise workflows.', ['RAG', 'Enterprise AI', 'LLM'], sources.commandR, 8),
  company('xai', 'xAI', 'AI company founded by Elon Musk', 'xAI develops Grok and AI systems integrated with the X ecosystem.', '2023-07-12', ['Elon Musk'], ['LLM', 'Chatbot', 'Research'], sources.xai, ['USA'], 8),
  product('grok', 'Grok', 'AI assistant by xAI', 'Grok is xAI’s conversational assistant product.', undefined, ['Chatbot', 'LLM'], sources.grok, 7),
  product('perplexity', 'Perplexity', 'AI answer engine', 'Perplexity is an AI answer engine that combines search, citations, and conversational exploration.', undefined, ['Search', 'Answer Engine', 'RAG'], sources.perplexity, 8),
  product('notion-ai', 'Notion AI', 'AI writing and workspace assistant', 'Notion AI brings writing, summarization, and automation features into the Notion workspace.', undefined, ['Productivity', 'Writing', 'Workspace'], sources.notion, 7),
  product('cursor', 'Cursor', 'AI code editor', 'Cursor is an AI-powered code editor built for pair programming and software development workflows.', undefined, ['Code', 'IDE', 'Agents'], sources.cursor, 9),
  company('github', 'GitHub', 'Developer platform', 'GitHub hosts software repositories and AI developer tools including GitHub Copilot.', undefined, [], ['Developer Platform', 'Open Source', 'Code'], sources.github, ['USA'], 9),
  product('github-copilot', 'GitHub Copilot', 'AI pair programmer', 'GitHub Copilot provides AI code completion, chat, and developer assistance inside coding tools.', undefined, ['Code', 'Assistant', 'Developer Tools'], sources.copilot, 9),
  company('microsoft', 'Microsoft', 'Cloud and AI platform company', 'Microsoft provides Azure AI services, GitHub, Copilot products, and enterprise AI infrastructure.', undefined, [], ['Cloud', 'Enterprise AI', 'Developer Tools'], sources.microsoft, ['USA'], 10),
  product('azure-openai-service', 'Azure OpenAI Service', 'Enterprise OpenAI deployment platform', 'Azure OpenAI Service provides access to OpenAI models through Microsoft Azure for enterprise applications.', undefined, ['Cloud', 'Enterprise AI', 'API'], sources.azureOpenai, 9),
  company('nvidia', 'NVIDIA', 'AI compute and accelerator company', 'NVIDIA provides GPUs, CUDA, TensorRT, and AI infrastructure used across model training and inference.', undefined, [], ['GPU', 'Inference', 'Training'], sources.nvidia, ['USA'], 10),
  technology('cuda', 'CUDA', 'NVIDIA parallel computing platform', 'CUDA is NVIDIA’s platform and programming model for GPU-accelerated computing.', undefined, ['GPU', 'Compute', 'Training'], sources.cuda, 10),
  technology('tensorrt', 'TensorRT', 'NVIDIA inference optimization stack', 'TensorRT optimizes neural network inference for NVIDIA GPUs.', undefined, ['Inference', 'Optimization', 'GPU'], sources.tensorrt, 8),
  openSource('langchain', 'LangChain', 'LLM application framework', 'LangChain is a framework for building LLM applications with chains, tools, agents, and retrieval integrations.', ['Agents', 'RAG', 'Framework'], sources.langchain, 9, sources.langchainGithub),
  openSource('llamaindex', 'LlamaIndex', 'Data framework for LLM apps', 'LlamaIndex connects private and public data to LLM applications through indexes, retrieval, and orchestration.', ['RAG', 'Data Framework', 'Agents'], sources.llamaIndex, 8, sources.llamaIndexGithub),
  technology('vector-database', 'Vector Database', 'Embedding search storage layer', 'Vector databases store embeddings and enable semantic retrieval for RAG and recommendation systems.', undefined, ['RAG', 'Embeddings', 'Search'], sources.vectorDb, 9),
  product('pinecone', 'Pinecone', 'Managed vector database', 'Pinecone is a managed vector database platform for semantic search and RAG applications.', undefined, ['Vector Database', 'RAG', 'Search'], sources.pinecone, 8),
  openSource('weaviate', 'Weaviate', 'Open source vector database', 'Weaviate is an open source vector database for AI-native applications.', ['Vector Database', 'Open Source', 'RAG'], sources.weaviate, 8),
  openSource('qdrant', 'Qdrant', 'Open source vector search engine', 'Qdrant is an open source vector database and similarity search engine.', ['Vector Database', 'Open Source', 'Search'], sources.qdrant, 8),
  openSource('kubernetes', 'Kubernetes', 'Container orchestration platform', 'Kubernetes is an open source platform for deploying and managing containerized applications.', ['Infrastructure', 'Orchestration', 'Cloud'], sources.kubernetes, 8),
  openSource('ray', 'Ray', 'Distributed AI compute framework', 'Ray is a distributed computing framework used for scalable AI workloads and model serving pipelines.', ['Distributed Computing', 'Training', 'Serving'], sources.ray, 8),
  openSource('vllm', 'vLLM', 'High-throughput LLM inference engine', 'vLLM is an open source inference and serving engine for large language models.', ['Inference', 'Serving', 'Open Source'], sources.vllm, 9, sources.vllm),
  openSource('ollama', 'Ollama', 'Local model runtime', 'Ollama lets users run and manage open models locally on personal machines and servers.', ['Local AI', 'Open Models', 'Runtime'], sources.ollama, 8),
  openSource('gradio', 'Gradio', 'ML app interface framework', 'Gradio is an open source Python library for quickly building machine learning demos and apps.', ['Demo', 'UI', 'Open Source'], sources.gradio, 7),
  openSource('streamlit', 'Streamlit', 'Python app framework for data and AI', 'Streamlit is an open source app framework for building data and AI applications in Python.', ['App Framework', 'Data Apps', 'Open Source'], sources.streamlit, 7),
  product('openrouter', 'OpenRouter', 'Unified model routing API', 'OpenRouter provides a unified API for accessing and comparing AI models from multiple providers.', undefined, ['Model Router', 'API', 'Developer Tools'], sources.openrouter, 7),
  company('together-ai', 'Together AI', 'AI cloud and open model platform', 'Together AI provides infrastructure and APIs for training, fine-tuning, and serving open models.', undefined, [], ['AI Cloud', 'Open Models', 'Inference'], sources.together, ['USA'], 8),
  company('scale-ai', 'Scale AI', 'Data platform for AI', 'Scale AI provides data, evaluation, and annotation infrastructure for AI systems.', undefined, [], ['Data', 'Evaluation', 'RLHF'], sources.scale, ['USA'], 8),
  research('arxiv', 'arXiv', 'Open research preprint repository', 'arXiv hosts open research preprints used heavily across machine learning and AI research.', undefined, ['Research', 'Papers', 'Open Access'], sources.arxiv, 8),
];

const edges: GraphEdge[] = [
  edge('e-openai-gpt4', 'openai', 'gpt4', 'built_on', [sources.openai, sources.gpt4]),
  edge('e-openai-gpt4o', 'openai', 'gpt4o', 'built_on', [sources.openai, sources.gpt4o]),
  edge('e-openai-chatgpt', 'openai', 'chatgpt', 'built_on', [sources.openai, sources.chatgpt]),
  edge('e-gpt4-chatgpt', 'gpt4', 'chatgpt', 'powered_by', [sources.gpt4, sources.chatgpt]),
  edge('e-gpt4o-chatgpt', 'gpt4o', 'chatgpt', 'powered_by', [sources.gpt4o, sources.chatgpt]),
  edge('e-openai-sora', 'openai', 'sora', 'built_on', [sources.openai, sources.sora]),
  edge('e-anthropic-claude3', 'anthropic', 'claude3', 'built_on', [sources.anthropic, sources.claude3]),
  edge('e-anthropic-claude35', 'anthropic', 'claude35-sonnet', 'built_on', [sources.anthropic, sources.claude35]),
  edge('e-claude35-claude', 'claude35-sonnet', 'claude', 'powered_by', [sources.claude35, sources.claude]),
  edge('e-google-deepmind', 'google', 'google-deepmind', 'acquired', [sources.google, sources.deepmind]),
  edge('e-deepmind-gemini', 'google-deepmind', 'gemini', 'built_on', [sources.deepmind, sources.gemini]),
  edge('e-gemini15-gemini', 'gemini-1-5', 'gemini', 'related_to', [sources.gemini15, sources.gemini]),
  edge('e-paper-transformer', 'attention-is-all-you-need', 'transformer', 'related_to', [sources.attentionPaper, sources.transformerPaper]),
  edge('e-transformer-gpt4', 'transformer', 'gpt4', 'uses', [sources.transformerPaper, sources.gpt4]),
  edge('e-transformer-claude3', 'transformer', 'claude3', 'uses', [sources.transformerPaper, sources.claude3]),
  edge('e-transformer-gemini', 'transformer', 'gemini', 'uses', [sources.transformerPaper, sources.gemini]),
  edge('e-meta-llama', 'meta', 'llama', 'built_on', [sources.meta, sources.llama]),
  edge('e-llama-llama3', 'llama', 'llama3', 'related_to', [sources.llama, sources.llama3]),
  edge('e-meta-pytorch', 'meta', 'pytorch', 'built_on', [sources.meta, sources.pytorch]),
  edge('e-hf-transformers', 'huggingface', 'transformers-library', 'built_on', [sources.huggingface, sources.transformers]),
  edge('e-transformers-llama', 'transformers-library', 'llama', 'related_to', [sources.transformers, sources.llama]),
  edge('e-diffusion-stablediffusion', 'diffusion-models', 'stable-diffusion', 'uses', [sources.diffusion, sources.stableDiffusion]),
  edge('e-stability-stablediffusion', 'stability-ai', 'stable-diffusion', 'built_on', [sources.stability, sources.stableDiffusion]),
  edge('e-diffusion-midjourney', 'diffusion-models', 'midjourney', 'uses', [sources.diffusion, sources.midjourney]),
  edge('e-diffusion-sora', 'diffusion-models', 'sora', 'uses', [sources.diffusion, sources.sora]),
  edge('e-mistral-mixtral', 'mistral-ai', 'mixtral', 'built_on', [sources.mistral, sources.mixtral]),
  edge('e-mistral-large', 'mistral-ai', 'mistral-large', 'built_on', [sources.mistral, sources.mistralLarge]),
  edge('e-cohere-commandr', 'cohere', 'command-r', 'built_on', [sources.cohere, sources.commandR]),
  edge('e-xai-grok', 'xai', 'grok', 'built_on', [sources.xai, sources.grok]),
  edge('e-github-copilot', 'github', 'github-copilot', 'built_on', [sources.github, sources.copilot]),
  edge('e-microsoft-github', 'microsoft', 'github', 'acquired', [sources.microsoft, sources.github]),
  edge('e-microsoft-azure-openai', 'microsoft', 'azure-openai-service', 'built_on', [sources.microsoft, sources.azureOpenai]),
  edge('e-azure-openai-gpt4', 'azure-openai-service', 'gpt4', 'powered_by', [sources.azureOpenai, sources.gpt4]),
  edge('e-gpt4-copilot', 'gpt4', 'github-copilot', 'powered_by', [sources.gpt4, sources.copilot]),
  edge('e-cursor-claude', 'claude35-sonnet', 'cursor', 'powered_by', [sources.claude35, sources.cursor]),
  edge('e-cursor-gpt4', 'gpt4o', 'cursor', 'powered_by', [sources.gpt4o, sources.cursor]),
  edge('e-nvidia-cuda', 'nvidia', 'cuda', 'built_on', [sources.nvidia, sources.cuda]),
  edge('e-nvidia-tensorrt', 'nvidia', 'tensorrt', 'built_on', [sources.nvidia, sources.tensorrt]),
  edge('e-cuda-pytorch', 'cuda', 'pytorch', 'uses', [sources.cuda, sources.pytorch]),
  edge('e-tensorrt-vllm', 'tensorrt', 'vllm', 'related_to', [sources.tensorrt, sources.vllm]),
  edge('e-langchain-rag', 'langchain', 'vector-database', 'uses', [sources.langchain, sources.vectorDb]),
  edge('e-llamaindex-rag', 'llamaindex', 'vector-database', 'uses', [sources.llamaIndex, sources.vectorDb]),
  edge('e-pinecone-vector', 'pinecone', 'vector-database', 'related_to', [sources.pinecone, sources.vectorDb]),
  edge('e-weaviate-vector', 'weaviate', 'vector-database', 'related_to', [sources.weaviate, sources.vectorDb]),
  edge('e-qdrant-vector', 'qdrant', 'vector-database', 'related_to', [sources.qdrant, sources.vectorDb]),
  edge('e-ray-vllm', 'ray', 'vllm', 'related_to', [sources.ray, sources.vllm]),
  edge('e-kubernetes-ray', 'kubernetes', 'ray', 'uses', [sources.kubernetes, sources.ray]),
  edge('e-vllm-llama3', 'vllm', 'llama3', 'uses', [sources.vllm, sources.llama3]),
  edge('e-ollama-llama3', 'ollama', 'llama3', 'uses', [sources.ollama, sources.llama3]),
  edge('e-gradio-hf', 'gradio', 'huggingface', 'related_to', [sources.gradio, sources.huggingface]),
  edge('e-streamlit-openai', 'streamlit', 'openai', 'related_to', [sources.streamlit, sources.openai]),
  edge('e-openrouter-openai', 'openrouter', 'openai', 'related_to', [sources.openrouter, sources.openai]),
  edge('e-openrouter-anthropic', 'openrouter', 'anthropic', 'related_to', [sources.openrouter, sources.anthropic]),
  edge('e-together-llama', 'together-ai', 'llama', 'related_to', [sources.together, sources.llama]),
  edge('e-scale-openai', 'scale-ai', 'openai', 'related_to', [sources.scale, sources.openai]),
  edge('e-arxiv-transformer', 'arxiv', 'attention-is-all-you-need', 'related_to', [sources.arxiv, sources.attentionPaper]),
  edge('e-perplexity-rag', 'perplexity', 'vector-database', 'uses', [sources.perplexity, sources.vectorDb]),
  edge('e-notion-openai', 'notion-ai', 'openai', 'related_to', [sources.notion, sources.openai]),
  edge('e-openai-anthropic', 'openai', 'anthropic', 'competes_with', [sources.openai, sources.anthropic]),
  edge('e-openai-google', 'openai', 'google-deepmind', 'competes_with', [sources.openai, sources.deepmind]),
  edge('e-anthropic-google', 'anthropic', 'google-deepmind', 'competes_with', [sources.anthropic, sources.deepmind]),
  edge('e-mistral-meta', 'mistral-ai', 'meta', 'competes_with', [sources.mistral, sources.meta]),
];

const graph: GraphData = { nodes, edges };
const outputPath = join(process.cwd(), 'server', 'data', 'graph-data.json');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');

console.log(`Seeded curated graph: ${graph.nodes.length} nodes and ${graph.edges.length} edges to ${outputPath}`);

function company(
  id: string,
  name: string,
  subtitle: string,
  description: string,
  foundedAt: string | undefined,
  founders: string[],
  tags: string[],
  source: string,
  country: string[],
  popularity = 7,
  events?: GraphNode['events'],
): GraphNode {
  return baseNode(id, name, 'Company', subtitle, description, tags, source, popularity, {
    ...(foundedAt ? { foundedAt } : {}),
    ...(founders.length ? { founders } : {}),
    ...(country.length ? { country: country.join(', ') } : {}),
    ...(events ? { events } : {}),
  });
}

function product(id: string, name: string, subtitle: string, description: string, foundedAt: string | undefined, tags: string[], source: string, popularity = 7): GraphNode {
  return baseNode(id, name, 'Product', subtitle, description, tags, source, popularity, foundedAt ? { foundedAt } : {});
}

function model(id: string, name: string, subtitle: string, description: string, tags: string[], source: string, popularity = 7): GraphNode {
  return baseNode(id, name, 'Model', subtitle, description, tags, source, popularity);
}

function technology(id: string, name: string, subtitle: string, description: string, foundedAt: string | undefined, tags: string[], source: string, popularity = 7): GraphNode {
  return baseNode(id, name, 'Technology', subtitle, description, tags, source, popularity, foundedAt ? { foundedAt } : {});
}

function research(id: string, name: string, subtitle: string, description: string, foundedAt: string | undefined, tags: string[], source: string, popularity = 7): GraphNode {
  return baseNode(id, name, 'Research', subtitle, description, tags, source, popularity, foundedAt ? { foundedAt } : {});
}

function openSource(id: string, name: string, subtitle: string, description: string, tags: string[], source: string, popularity = 7, github?: string): GraphNode {
  return baseNode(id, name, 'Open Source', subtitle, description, tags, source, popularity, github ? { github } : {});
}

function baseNode(id: string, name: string, type: GraphNode['type'], subtitle: string, description: string, tags: string[], source: string, popularity: number, extra: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    name,
    type,
    subtitle,
    description,
    tags,
    popularity,
    status: 'Active',
    website: source,
    logo: faviconUrl(source),
    sourceList: [source],
    relatedTechnology: tags,
    aiConfidence: 0.9,
    aiSummary: `${name} is a verified OpenConstellation entity sourced from public documentation and connected to adjacent AI ecosystem nodes through curated relationships.`,
    ...extra,
  };
}

function faviconUrl(source: string) {
  const host = new URL(source).hostname;
  return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
}

function edge(id: string, sourceId: string, targetId: string, relationType: RelationType, sourceList: string[]): GraphEdge {
  return {
    id,
    sourceId,
    targetId,
    relationType,
    weight: relationType === 'competes_with' ? 0.8 : 1,
    confidence: 0.82,
    sourceList,
  };
}

function event(date: string, title: string, description: string) {
  return { date, title, description };
}
