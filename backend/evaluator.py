# =========================================================
# MissionLMS EVALUATION ENGINE
# =========================================================


# =========================================================
# INTRODUCTION TO ARTIFICIAL INTELLIGENCE
# =========================================================

def evaluate_ai_introduction_assignment(content: str):

    answer = content.lower().strip()

    score = 0
    feedback_parts = []


    # -----------------------------------------------------
    # Check answer length
    # -----------------------------------------------------

    if len(answer.split()) >= 30:

        score += 25

        feedback_parts.append(
            "La réponse contient suffisamment d'explications."
        )

    else:

        feedback_parts.append(
            "Ajoutez davantage d'explications à vos exemples."
        )


    # -----------------------------------------------------
    # Check AI-related concepts
    # -----------------------------------------------------

    ai_terms = [

        # English
        "ai",
        "artificial intelligence",
        "voice assistant",
        "recommendation",
        "recommend",
        "spam",
        "recognition",
        "recognize",
        "prediction",
        "predict",
        "assistant",
        "chatbot",

        # Français
        "ia",
        "intelligence artificielle",
        "assistant",
        "chatbot",
        "recommandation",
        "recommandations",
        "recommander",
        "recommande",
        "reconnaissance",
        "reconnaître",
        "reconnait",
        "prédiction",
        "prédire",
        "prédit",
        "détection",
        "détecter",
        "analyse",
        "analyser",
        "apprentissage"
    ]


    detected_terms = sum(
        1 for term in ai_terms
        if term in answer
    )


    if detected_terms >= 3:

        score += 25

        feedback_parts.append(
            "La réponse identifie plusieurs applications de l'intelligence artificielle."
        )

    else:

        feedback_parts.append(
            "Ajoutez davantage d'exemples clairs d'applications de l'intelligence artificielle."
        )


    # -----------------------------------------------------
    # Check for three examples
    # -----------------------------------------------------

    example_markers = [
        "1.",
        "2.",
        "3."
    ]


    has_three_examples = all(
        marker in answer
        for marker in example_markers
    )


    if has_three_examples:

        score += 25

        feedback_parts.append(
            "Trois exemples sont fournis."
        )

    else:

        feedback_parts.append(
            "Présentez trois exemples clairement identifiés."
        )


    # -----------------------------------------------------
    # Check explanations
    # -----------------------------------------------------

    explanation_terms = [

        # English
        "uses",
        "use",
        "understand",
        "suggest",
        "detect",
        "recognize",
        "predict",
        "recommend",
        "provide",
        "analyze",
        "analyse",

        # Français
        "utilise",
        "utiliser",
        "utilisation",
        "comprend",
        "comprendre",
        "suggère",
        "suggérer",
        "détecte",
        "détecter",
        "reconnaît",
        "reconnaître",
        "prédit",
        "prédire",
        "recommande",
        "recommander",
        "fournit",
        "fournir",
        "analyse",
        "analyser",
        "permet",
        "permettre",
        "aide",
        "aider",
        "propose",
        "proposer",
        "traite",
        "traiter",
        "identifie",
        "identifier"
    ]


    has_explanation = any(
        term in answer
        for term in explanation_terms
    )


    if has_explanation:

        score += 25

        feedback_parts.append(
            "Les exemples expliquent ce que fait l'intelligence artificielle."
        )

    else:

        feedback_parts.append(
            "Expliquez ce que fait l'intelligence artificielle dans chaque exemple."
        )


    # -----------------------------------------------------
    # Final feedback
    # -----------------------------------------------------

    if score >= 80:

        feedback = (
            "Excellent travail. "
            + " ".join(feedback_parts)
        )

    else:

        feedback = (
            "Le travail nécessite quelques corrections. "
            + " ".join(feedback_parts)
        )


    return {
        "score": score,
        "feedback": feedback
    }


# =========================================================
# PYTHON FUNDAMENTALS
# =========================================================

def evaluate_python_assignment(content: str):

    code = content.lower()

    score = 0
    feedback_parts = []


    # -----------------------------------------------------
    # Check input()
    # -----------------------------------------------------

    uses_input = "input(" in code


    if uses_input:

        score += 50

        feedback_parts.append(
            "Le programme demande correctement une information à l'utilisateur."
        )

    else:

        feedback_parts.append(
            "Le programme doit utiliser input() pour demander le nom de l'utilisateur."
        )


    # -----------------------------------------------------
    # Check print()
    # -----------------------------------------------------

    uses_print = "print(" in code


    if uses_print:

        score += 50

        feedback_parts.append(
            "Le programme affiche un message avec print()."
        )

    else:

        feedback_parts.append(
            "Le programme doit utiliser print() pour afficher un message de bienvenue."
        )


    # -----------------------------------------------------
    # Final feedback
    # -----------------------------------------------------

    if score >= 80:

        feedback = (
            "Excellent travail. "
            + " ".join(feedback_parts)
        )

    else:

        feedback = (
            "Le travail nécessite quelques corrections. "
            + " ".join(feedback_parts)
        )


    return {
        "score": score,
        "feedback": feedback
    }


# =========================================================
# NUMPY FUNDAMENTALS
# =========================================================

def evaluate_numpy_assignment(content: str):

    code = content.lower()

    score = 0
    feedback_parts = []


    # -----------------------------------------------------
    # Check NumPy import
    # -----------------------------------------------------

    imports_numpy = (
        "import numpy" in code
        or "from numpy" in code
    )


    if imports_numpy:

        score += 25

        feedback_parts.append(
            "NumPy est importé correctement."
        )

    else:

        feedback_parts.append(
            "Le programme doit importer NumPy."
        )


    # -----------------------------------------------------
    # Check array creation
    # -----------------------------------------------------

    creates_array = (
        "np.array" in code
        or "numpy.array" in code
    )


    if creates_array:

        score += 25

        feedback_parts.append(
            "Un tableau NumPy est créé."
        )

    else:

        feedback_parts.append(
            "Le programme doit créer un tableau NumPy."
        )


    # -----------------------------------------------------
    # Check required numbers
    # -----------------------------------------------------

    has_numbers = (
        "1" in code
        and "2" in code
        and "3" in code
        and "4" in code
        and "5" in code
    )


    if has_numbers:

        score += 25

        feedback_parts.append(
            "Les nombres 1, 2, 3, 4 et 5 sont présents."
        )

    else:

        feedback_parts.append(
            "Le tableau doit contenir les nombres 1, 2, 3, 4 et 5."
        )


    # -----------------------------------------------------
    # Check display
    # -----------------------------------------------------

    displays_result = "print(" in code


    if displays_result:

        score += 25

        feedback_parts.append(
            "Le programme affiche le résultat."
        )

    else:

        feedback_parts.append(
            "Le programme doit afficher le tableau."
        )


    # -----------------------------------------------------
    # Final feedback
    # -----------------------------------------------------

    if score >= 80:

        feedback = (
            "Excellent travail. "
            + " ".join(feedback_parts)
        )

    else:

        feedback = (
            "Le travail nécessite quelques corrections. "
            + " ".join(feedback_parts)
        )


    return {
        "score": score,
        "feedback": feedback
    }


# =========================================================
# PANDAS FUNDAMENTALS
# =========================================================

def evaluate_pandas_assignment(content: str):

    code = content.lower()

    score = 0
    feedback_parts = []


    # -----------------------------------------------------
    # Check Pandas import
    # -----------------------------------------------------

    imports_pandas = (
        "import pandas" in code
        or "from pandas" in code
    )


    if imports_pandas:

        score += 25

        feedback_parts.append(
            "Pandas est importé correctement."
        )

    else:

        feedback_parts.append(
            "Le programme doit importer Pandas."
        )


    # -----------------------------------------------------
    # Check DataFrame creation
    # -----------------------------------------------------

    creates_dataframe = (
        "pd.dataframe" in code
        or "pandas.dataframe" in code
        or "dataframe(" in code
    )


    if creates_dataframe:

        score += 25

        feedback_parts.append(
            "Un DataFrame Pandas est créé."
        )

    else:

        feedback_parts.append(
            "Le programme doit créer un DataFrame Pandas."
        )


    # -----------------------------------------------------
    # Check that data is provided
    # -----------------------------------------------------

    has_data = (
        "{" in code
        and "}" in code
        and "[" in code
        and "]" in code
    )


    if has_data:

        score += 25

        feedback_parts.append(
            "Les données du DataFrame sont présentes."
        )

    else:

        feedback_parts.append(
            "Le DataFrame doit contenir des données "
            "organisées en colonnes et en lignes."
        )


    # -----------------------------------------------------
    # Check display
    # -----------------------------------------------------

    displays_result = "print(" in code


    if displays_result:

        score += 25

        feedback_parts.append(
            "Le programme affiche le DataFrame."
        )

    else:

        feedback_parts.append(
            "Le programme doit afficher le DataFrame."
        )


    # -----------------------------------------------------
    # Final feedback
    # -----------------------------------------------------

    if score >= 80:

        feedback = (
            "Excellent travail. "
            + " ".join(feedback_parts)
        )

    else:

        feedback = (
            "Le travail nécessite quelques corrections. "
            + " ".join(feedback_parts)
        )


    return {
        "score": score,
        "feedback": feedback
    }


# =========================================================
# MAIN EVALUATOR
# =========================================================

def evaluate_submission(
    assignment_title: str,
    instructions: str,
    content: str,
    mission_number: int | None = None
):
    """
    Sélectionne l'évaluateur approprié selon le numéro
    de la mission.

    Le numéro de mission provient de la base de données
    et est donc plus fiable que le titre du travail.
    """


    # =====================================================
    # MISSION 1 - INTRODUCTION À L'IA
    # =====================================================

    if mission_number == 1:

        return evaluate_ai_introduction_assignment(
            content
        )


    # =====================================================
    # MISSION 2 - PYTHON
    # =====================================================

    if mission_number == 2:

        return evaluate_python_assignment(
            content
        )


    # =====================================================
    # MISSION 3 - NUMPY
    # =====================================================

    if mission_number == 3:

        return evaluate_numpy_assignment(
            content
        )


    # =====================================================
    # MISSION 4 - PANDAS
    # =====================================================

    if mission_number == 4:

        return evaluate_pandas_assignment(
            content
        )


    # =====================================================
    # TEMPORARY BACKWARD COMPATIBILITY
    # =====================================================

    title = assignment_title.lower()


    if (
        "everyday life" in title
        or "artificial intelligence" in title
    ):

        return evaluate_ai_introduction_assignment(
            content
        )


    if "numpy" in title:

        return evaluate_numpy_assignment(
            content
        )


    if (
        "pandas" in title
        or "dataframe" in title
    ):

        return evaluate_pandas_assignment(
            content
        )


    if "python" in title:

        return evaluate_python_assignment(
            content
        )


    # =====================================================
    # NO EVALUATOR AVAILABLE
    # =====================================================

    return {
        "score": None,
        "feedback": (
            "Ce travail ne possède pas encore "
            "de règle d'évaluation automatique."
        )
    }