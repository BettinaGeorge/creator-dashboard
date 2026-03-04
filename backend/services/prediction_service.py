from ml.predictor import predict_reel


class PredictionService:

    @staticmethod
    def predict(data):
        return predict_reel(data)