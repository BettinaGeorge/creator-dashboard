def build_features(hook_text, duration, category, audio_type):
    
    return {
        "hook_length": len(hook_text),
        "duration": duration,
        "category": category,
        "audio_type": audio_type
    }